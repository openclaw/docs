---
read_when:
    - Adicionando recursos que ampliam o acesso ou a automação
summary: Considerações de segurança e modelo de ameaça para executar um Gateway de IA com acesso ao shell
title: Segurança
x-i18n:
    generated_at: "2026-06-27T17:34:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9d4312e55f369e627a6549e7f11f2c7047f8a8f857ca6d31c5bd1b8c743a6df9
    source_path: gateway/security/index.md
    workflow: 16
---

<Warning>
  **Modelo de confiança de assistente pessoal.** Esta orientação pressupõe um limite de
  operador confiável por gateway (modelo de usuário único, assistente pessoal).
  OpenClaw **não** é um limite de segurança multilocatário hostil para vários
  usuários adversariais compartilhando um agente ou gateway. Se você precisar de operação
  com confiança mista ou usuários adversariais, separe os limites de confiança (gateway +
  credenciais separados, idealmente usuários ou hosts de SO separados).
</Warning>

## Primeiro, o escopo: modelo de segurança de assistente pessoal

A orientação de segurança do OpenClaw pressupõe uma implantação de **assistente pessoal**: um limite de operador confiável, possivelmente muitos agentes.

- Postura de segurança compatível: um usuário/limite de confiança por gateway (prefira um usuário de SO/host/VPS por limite).
- Não é um limite de segurança compatível: um gateway/agente compartilhado usado por usuários mutuamente não confiáveis ou adversariais.
- Se for necessário isolamento de usuários adversariais, separe por limite de confiança (gateway + credenciais separados e, idealmente, usuários/hosts de SO separados).
- Se vários usuários não confiáveis puderem enviar mensagens para um agente com ferramentas habilitadas, trate-os como compartilhando a mesma autoridade de ferramenta delegada desse agente.

Esta página explica o reforço de segurança **dentro desse modelo**. Ela não afirma isolamento multilocatário hostil em um gateway compartilhado.

Antes de alterar acesso remoto, política de DM, proxy reverso ou exposição pública,
use o [runbook de exposição do Gateway](/pt-BR/gateway/security/exposure-runbook) como uma
lista de verificação de pré-voo e reversão.

## Verificação rápida: `openclaw security audit`

Veja também: [Verificação Formal (Modelos de Segurança)](/pt-BR/security/formal-verification)

Execute isto regularmente (especialmente depois de alterar a configuração ou expor superfícies de rede):

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
openclaw security audit --json
```

`security audit --fix` permanece intencionalmente restrito: ele muda políticas comuns de grupos abertos
para listas de permissões, restaura `logging.redactSensitive: "tools"`, endurece
permissões de estado/configuração/arquivos incluídos e usa redefinições de ACL do Windows em vez de
`chmod` POSIX ao executar no Windows.

Ele sinaliza problemas comuns (exposição de autenticação do Gateway, exposição de controle do navegador, listas de permissões elevadas, permissões do sistema de arquivos, aprovações de exec permissivas e exposição de ferramentas em canais abertos).

OpenClaw é tanto um produto quanto um experimento: você está conectando comportamento de modelos de fronteira a superfícies reais de mensagens e ferramentas reais. **Não existe configuração "perfeitamente segura".** O objetivo é agir deliberadamente sobre:

- quem pode falar com seu bot
- onde o bot tem permissão para agir
- no que o bot pode tocar

Comece com o menor acesso que ainda funciona e amplie conforme ganhar confiança.

### Bloqueio de dependências do pacote publicado

Checkouts do código-fonte do OpenClaw usam `pnpm-lock.yaml`. O pacote npm `openclaw`
publicado e os pacotes npm de plugins pertencentes ao OpenClaw incluem `npm-shrinkwrap.json`,
o lockfile de dependências publicável do npm, para que as instalações de pacotes usem o grafo
de dependências transitivas revisado da versão, em vez de resolver um grafo novo
no momento da instalação.

Shrinkwrap é um limite de reforço da cadeia de suprimentos e reprodutibilidade de release,
não um sandbox. Para o modelo em linguagem simples, comandos de mantenedor e verificações
de inspeção de pacote, veja [npm shrinkwrap](/pt-BR/gateway/security/shrinkwrap).

### Confiança na implantação e no host

OpenClaw pressupõe que o limite de host e configuração é confiável:

- Se alguém puder modificar o estado/configuração do host do Gateway (`~/.openclaw`, incluindo `openclaw.json`), trate essa pessoa como um operador confiável.
- Executar um Gateway para vários operadores mutuamente não confiáveis/adversariais **não é uma configuração recomendada**.
- Para equipes com confiança mista, separe limites de confiança com gateways separados (ou, no mínimo, usuários/hosts de SO separados).
- Padrão recomendado: um usuário por máquina/host (ou VPS), um gateway para esse usuário e um ou mais agentes nesse gateway.
- Dentro de uma instância de Gateway, o acesso autenticado de operador é uma função confiável de plano de controle, não uma função de locatário por usuário.
- Identificadores de sessão (`sessionKey`, IDs de sessão, rótulos) são seletores de roteamento, não tokens de autorização.
- Se várias pessoas puderem enviar mensagens para um agente com ferramentas habilitadas, cada uma delas poderá orientar esse mesmo conjunto de permissões. O isolamento de sessão/memória por usuário ajuda na privacidade, mas não transforma um agente compartilhado em autorização de host por usuário.

### Operações seguras de arquivo

OpenClaw usa `@openclaw/fs-safe` para acesso a arquivos limitado por raiz, gravações atômicas, extração de arquivos compactados, workspaces temporários e helpers de arquivos secretos. Por padrão, o OpenClaw deixa o helper POSIX Python opcional do fs-safe **desativado**; defina `OPENCLAW_FS_SAFE_PYTHON_MODE=auto` ou `require` apenas quando você quiser o reforço extra de mutação relativa a fd e puder oferecer suporte a um runtime Python.

Detalhes: [Operações seguras de arquivo](/pt-BR/gateway/security/secure-file-operations).

### Workspace Slack compartilhado: risco real

Se "todos no Slack podem enviar mensagens ao bot", o risco central é a autoridade de ferramenta delegada:

- qualquer remetente permitido pode induzir chamadas de ferramenta (`exec`, navegador, ferramentas de rede/arquivo) dentro da política do agente;
- injeção de prompt/conteúdo de um remetente pode causar ações que afetam estado, dispositivos ou saídas compartilhadas;
- se um agente compartilhado tiver credenciais/arquivos sensíveis, qualquer remetente permitido pode potencialmente conduzir exfiltração por meio do uso de ferramentas.

Use agentes/gateways separados com ferramentas mínimas para fluxos de trabalho de equipe; mantenha agentes com dados pessoais privados.

### Agente compartilhado pela empresa: padrão aceitável

Isso é aceitável quando todos que usam esse agente estão no mesmo limite de confiança (por exemplo, uma equipe da empresa) e o agente é estritamente limitado ao escopo de negócios.

- execute-o em uma máquina/VM/contêiner dedicado;
- use um usuário de SO dedicado + navegador/perfil/contas dedicados para esse runtime;
- não autentique esse runtime em contas pessoais Apple/Google ou perfis pessoais de gerenciador de senhas/navegador.

Se você misturar identidades pessoais e corporativas no mesmo runtime, você elimina a separação e aumenta o risco de exposição de dados pessoais.

## Conceito de confiança do Gateway e do Node

Trate Gateway e Node como um domínio de confiança de operador, com funções diferentes:

- **Gateway** é o plano de controle e a superfície de política (`gateway.auth`, política de ferramentas, roteamento).
- **Node** é a superfície de execução remota pareada a esse Gateway (comandos, ações de dispositivo, capacidades locais do host).
- Um chamador autenticado no Gateway é confiável no escopo do Gateway. Após o pareamento, ações de Node são ações de operador confiáveis nesse Node.
- Os níveis de escopo de operador e as verificações no momento da aprovação estão resumidos em
  [Escopos de operador](/pt-BR/gateway/operator-scopes).
- Clientes diretos de backend em loopback autenticados com o token/senha compartilhado do gateway
  podem fazer RPCs internos do plano de controle sem apresentar uma identidade de dispositivo
  de usuário. Isso não é um bypass de pareamento remoto ou de navegador: clientes de rede,
  clientes Node, clientes com token de dispositivo e identidades explícitas de dispositivo
  ainda passam por pareamento e aplicação de upgrade de escopo.
- `sessionKey` é seleção de roteamento/contexto, não autenticação por usuário.
- Aprovações de exec (lista de permissões + perguntar) são proteções para a intenção do operador, não isolamento multilocatário hostil.
- O padrão de produto do OpenClaw para configurações confiáveis de operador único é que exec no host em `gateway`/`node` seja permitido sem prompts de aprovação (`security="full"`, `ask="off"` a menos que você endureça isso). Esse padrão é UX intencional, não uma vulnerabilidade por si só.
- Aprovações de exec vinculam o contexto exato da solicitação e operandos locais diretos de arquivo em melhor esforço; elas não modelam semanticamente todos os caminhos de carregador de runtime/interpretador. Use sandboxing e isolamento de host para limites fortes.

Se você precisar de isolamento de usuário hostil, separe os limites de confiança por usuário/host de SO e execute gateways separados.

## Matriz de limites de confiança

Use isto como o modelo rápido ao triar risco:

| Limite ou controle                                       | O que significa                                     | Interpretação equivocada comum                                                                |
| --------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `gateway.auth` (token/password/trusted-proxy/device auth) | Autentica chamadores nas APIs do gateway             | "Precisa de assinaturas por mensagem em cada frame para ser seguro"                    |
| `sessionKey`                                              | Chave de roteamento para seleção de contexto/sessão         | "A chave de sessão é um limite de autenticação de usuário"                                         |
| Proteções de prompt/conteúdo                                 | Reduzem o risco de abuso do modelo                           | "Injeção de prompt sozinha prova bypass de autenticação"                                   |
| `canvas.eval` / browser evaluate                          | Capacidade intencional de operador quando habilitada      | "Qualquer primitivo de eval JS é automaticamente uma vulnerabilidade neste modelo de confiança"           |
| Shell `!` da TUI local                                       | Execução local explicitamente acionada pelo operador       | "Comando de conveniência de shell local é injeção remota"                         |
| Pareamento de Node e comandos de Node                            | Execução remota em nível de operador em dispositivos pareados | "Controle remoto de dispositivo deve ser tratado como acesso de usuário não confiável por padrão" |
| `gateway.nodes.pairing.autoApproveCidrs`                  | Política opt-in de inscrição de Node em rede confiável     | "Uma lista de permissões desativada por padrão é uma vulnerabilidade automática de pareamento"       |

## Não são vulnerabilidades por design

<Accordion title="Descobertas comuns que estão fora de escopo">

Esses padrões são relatados com frequência e geralmente são encerrados sem ação, a menos que
um bypass real de limite seja demonstrado:

- Cadeias apenas de injeção de prompt sem bypass de política, autenticação ou sandbox.
- Alegações que pressupõem operação multilocatária hostil em um host ou
  configuração compartilhados.
- Alegações que classificam acesso normal de leitura por operador (por exemplo
  `sessions.list` / `sessions.preview` / `chat.history`) como IDOR em uma
  configuração de gateway compartilhado.
- Descobertas de implantação apenas em localhost (por exemplo HSTS em um gateway
  apenas de loopback).
- Descobertas de assinatura de Webhook de entrada do Discord para caminhos de entrada que não
  existem neste repo.
- Relatórios que tratam metadados de pareamento de Node como uma segunda camada oculta de
  aprovação por comando para `system.run`, quando o limite real de execução ainda é
  a política global de comandos de Node do gateway mais as aprovações de exec
  do próprio Node.
- Relatórios que tratam `gateway.nodes.pairing.autoApproveCidrs` configurado como uma
  vulnerabilidade por si só. Essa configuração é desativada por padrão, exige
  entradas CIDR/IP explícitas, aplica-se apenas ao primeiro pareamento com `role: node`
  sem escopos solicitados e não aprova automaticamente operador/navegador/Control UI,
  WebChat, upgrades de função, upgrades de escopo, alterações de metadados, alterações de chave pública
  ou caminhos de cabeçalho trusted-proxy de loopback no mesmo host, a menos que a autenticação trusted-proxy de loopback tenha sido explicitamente habilitada.
- Descobertas de "autorização por usuário ausente" que tratam `sessionKey` como um
  token de autenticação.

</Accordion>

## Linha de base reforçada em 60 segundos

Use esta linha de base primeiro e depois reabilite ferramentas seletivamente por agente confiável:

```json5
{
  gateway: {
    mode: "local",
    bind: "loopback",
    auth: { mode: "token", token: "replace-with-long-random-token" },
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

Isso mantém o Gateway apenas local, isola DMs e desabilita ferramentas de plano de controle/runtime por padrão.

## Regra rápida para caixa de entrada compartilhada

Se mais de uma pessoa puder enviar DM para seu bot:

- Defina `session.dmScope: "per-channel-peer"` (ou `"per-account-channel-peer"` para canais com várias contas).
- Mantenha `dmPolicy: "pairing"` ou listas de permissões estritas.
- Nunca combine DMs compartilhadas com acesso amplo a ferramentas.
- Isso fortalece caixas de entrada cooperativas/compartilhadas, mas não foi projetado como isolamento contra co-locatários hostis quando usuários compartilham acesso de gravação ao host/configuração.

## Modelo de visibilidade de contexto

O OpenClaw separa dois conceitos:

- **Autorização de acionamento**: quem pode acionar o agente (`dmPolicy`, `groupPolicy`, listas de permissões, gates de menção).
- **Visibilidade de contexto**: qual contexto suplementar é injetado na entrada do modelo (corpo da resposta, texto citado, histórico da thread, metadados encaminhados).

Listas de permissões controlam acionamentos e autorização de comandos. A configuração `contextVisibility` controla como o contexto suplementar (respostas citadas, raízes de thread, histórico buscado) é filtrado:

- `contextVisibility: "all"` (padrão) mantém o contexto suplementar conforme recebido.
- `contextVisibility: "allowlist"` filtra o contexto suplementar para remetentes permitidos pelas verificações de lista de permissões ativas.
- `contextVisibility: "allowlist_quote"` se comporta como `allowlist`, mas ainda mantém uma resposta citada explícita.

Defina `contextVisibility` por canal ou por sala/conversa. Consulte [Conversas em grupo](/pt-BR/channels/groups#context-visibility-and-allowlists) para detalhes de configuração.

Orientação consultiva de triagem:

- Alegações que mostram apenas que "o modelo pode ver texto citado ou histórico de remetentes fora da lista de permissões" são achados de fortalecimento tratáveis com `contextVisibility`, não bypasses de autorização ou de limite de sandbox por si só.
- Para ter impacto de segurança, os relatórios ainda precisam demonstrar um bypass de limite de confiança (autorização, política, sandbox, aprovação ou outro limite documentado).

## O que a auditoria verifica (alto nível)

- **Acesso de entrada** (políticas de DM, políticas de grupo, listas de permissões): estranhos conseguem acionar o bot?
- **Raio de impacto de ferramentas** (ferramentas elevadas + salas abertas): injeção de prompt poderia virar ações de shell/arquivo/rede?
- **Deriva do sistema de arquivos de execução**: ferramentas mutantes de sistema de arquivos são negadas enquanto `exec`/`process` permanecem disponíveis sem restrições de sistema de arquivos do sandbox?
- **Deriva de aprovação de execução** (`security=full`, `autoAllowSkills`, listas de permissões de interpretador sem `strictInlineEval`): as proteções de execução no host ainda estão fazendo o que você acha que estão?
  - `security="full"` é um aviso amplo de postura, não prova de bug. É o padrão escolhido para configurações confiáveis de assistente pessoal; restrinja-o apenas quando seu modelo de ameaça precisar de proteções por aprovação ou lista de permissões.
- **Exposição de rede** (bind/autenticação do Gateway, Tailscale Serve/Funnel, tokens de autenticação fracos/curtos).
- **Exposição de controle do navegador** (nós remotos, portas de relay, endpoints CDP remotos).
- **Higiene de disco local** (permissões, symlinks, includes de configuração, caminhos de "pasta sincronizada").
- **Plugins** (plugins carregam sem uma lista de permissões explícita).
- **Deriva/má configuração de política** (configurações de docker de sandbox configuradas mas modo sandbox desligado; padrões `gateway.nodes.denyCommands` ineficazes porque a correspondência é apenas por nome exato de comando (por exemplo `system.run`) e não inspeciona texto de shell; entradas `gateway.nodes.allowCommands` perigosas; `tools.profile="minimal"` global sobrescrito por perfis por agente; ferramentas pertencentes a Plugin alcançáveis sob política permissiva de ferramentas).
- **Deriva de expectativa de runtime** (por exemplo, presumir que execução implícita ainda significa `sandbox` quando `tools.exec.host` agora usa `auto` por padrão, ou definir explicitamente `tools.exec.host="sandbox"` enquanto o modo sandbox está desligado).
- **Higiene de modelo** (avisa quando os modelos configurados parecem legados; não é um bloqueio rígido).

Se você executar `--deep`, o OpenClaw também tenta uma sondagem live de Gateway em melhor esforço.

## Mapa de armazenamento de credenciais

Use isto ao auditar acesso ou decidir o que incluir no backup:

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Token de bot do Telegram**: configuração/env ou `channels.telegram.tokenFile` (somente arquivo regular; symlinks rejeitados)
- **Token de bot do Discord**: configuração/env ou SecretRef (provedores env/file/exec)
- **Tokens do Slack**: configuração/env (`channels.slack.*`)
- **Listas de permissões de pareamento**:
  - `~/.openclaw/credentials/<channel>-allowFrom.json` (conta padrão)
  - `~/.openclaw/credentials/<channel>-<accountId>-allowFrom.json` (contas não padrão)
- **Perfis de autenticação de modelo**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **Estado de runtime do Codex**: `~/.openclaw/agents/<agentId>/agent/codex-home/`
- **Payload de segredos baseado em arquivo (opcional)**: `~/.openclaw/secrets.json`
- **Importação OAuth legada**: `~/.openclaw/credentials/oauth.json`

## Checklist de auditoria de segurança

Quando a auditoria imprimir achados, trate isto como ordem de prioridade:

1. **Qualquer coisa "aberta" + ferramentas habilitadas**: bloqueie DMs/grupos primeiro (pareamento/listas de permissões), depois restrinja a política de ferramentas/sandboxing.
2. **Exposição de rede pública** (bind em LAN, Funnel, autenticação ausente): corrija imediatamente.
3. **Exposição remota de controle do navegador**: trate como acesso de operador (somente tailnet, pareie nós deliberadamente, evite exposição pública).
4. **Permissões**: garanta que estado/configuração/credenciais/autenticação não sejam legíveis por grupo/mundo.
5. **Plugins**: carregue apenas o que você confia explicitamente.
6. **Escolha de modelo**: prefira modelos modernos e endurecidos para instruções para qualquer bot com ferramentas.

## Glossário de auditoria de segurança

Cada achado de auditoria é identificado por um `checkId` estruturado (por exemplo
`gateway.bind_no_auth` ou `tools.exec.security_full_configured`). Classes comuns
de severidade crítica:

- `fs.*` - permissões de sistema de arquivos em estado, configuração, credenciais, perfis de autenticação.
- `gateway.*` - modo de bind, autenticação, Tailscale, UI de Controle, configuração de proxy confiável.
- `hooks.*`, `browser.*`, `sandbox.*`, `tools.exec.*` - fortalecimento por superfície.
- `plugins.*`, `skills.*` - cadeia de suprimentos de plugin/skill e achados de varredura.
- `security.exposure.*` - verificações transversais em que a política de acesso encontra o raio de impacto das ferramentas.

Veja o catálogo completo com níveis de severidade, chaves de correção e suporte a correção automática em
[Verificações de auditoria de segurança](/pt-BR/gateway/security/audit-checks).

## UI de Controle sobre HTTP

A UI de Controle precisa de um **contexto seguro** (HTTPS ou localhost) para gerar identidade
do dispositivo. `gateway.controlUi.allowInsecureAuth` é um alternador de compatibilidade local:

- Em localhost, ele permite autenticação da UI de Controle sem identidade de dispositivo quando a página
  é carregada sobre HTTP não seguro.
- Ele não ignora verificações de pareamento.
- Ele não relaxa requisitos de identidade de dispositivo remotos (não localhost).

Prefira HTTPS (Tailscale Serve) ou abra a UI em `127.0.0.1`.

Somente para cenários de emergência, `gateway.controlUi.dangerouslyDisableDeviceAuth`
desabilita totalmente as verificações de identidade do dispositivo. Isso é um rebaixamento grave de segurança;
mantenha desativado a menos que você esteja depurando ativamente e possa reverter rapidamente.

Separado dessas flags perigosas, `gateway.auth.mode: "trusted-proxy"` bem-sucedido
pode admitir sessões **operadoras** da UI de Controle sem identidade de dispositivo. Esse é um
comportamento intencional do modo de autenticação, não um atalho de `allowInsecureAuth`, e ele ainda
não se estende a sessões da UI de Controle com papel de nó.

`openclaw security audit` avisa quando esta configuração está habilitada.

## Resumo de flags inseguras ou perigosas

`openclaw security audit` gera `config.insecure_or_dangerous_flags` quando
switches conhecidos de depuração inseguros/perigosos estão habilitados. Mantenha-os não definidos em
produção. Cada flag habilitada é relatada como seu próprio achado. Se supressões de auditoria
estiverem configuradas, `security.audit.suppressions.active` permanece na saída de auditoria
ativa mesmo quando achados correspondentes passam para `suppressedFindings`.

<AccordionGroup>
  <Accordion title="Flags tracked by the audit today">
    - `gateway.controlUi.allowInsecureAuth=true`
    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth=true`
    - `security.audit.suppressions configured (<count>)`
    - `hooks.gmail.allowUnsafeExternalContent=true`
    - `hooks.mappings[<index>].allowUnsafeExternalContent=true`
    - `tools.exec.applyPatch.workspaceOnly=false`
    - `plugins.entries.acpx.config.permissionMode=approve-all`

  </Accordion>

  <Accordion title="All `dangerous*` / `dangerously*` keys in the config schema">
    UI de Controle e navegador:

    - `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback`
    - `gateway.controlUi.dangerouslyDisableDeviceAuth`
    - `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`

    Correspondência por nome de canal (canais agrupados e de Plugin; também disponível por
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

    Docker de sandbox (padrões + por agente):

    - `agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets`
    - `agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources`
    - `agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin`

  </Accordion>
</AccordionGroup>

## Configuração de proxy reverso

Se você executar o Gateway atrás de um proxy reverso (nginx, Caddy, Traefik etc.), configure
`gateway.trustedProxies` para tratamento adequado do IP do cliente encaminhado.

Quando o Gateway detecta cabeçalhos de proxy vindos de um endereço que **não** está em `trustedProxies`, ele **não** tratará conexões como clientes locais. Se a autenticação do Gateway estiver desabilitada, essas conexões serão rejeitadas. Isso previne bypass de autenticação em que conexões com proxy pareceriam vir de localhost e receberiam confiança automática.

`gateway.trustedProxies` também alimenta `gateway.auth.mode: "trusted-proxy"`, mas esse modo de autenticação é mais estrito:

- a autenticação trusted-proxy **falha fechada em proxies de origem loopback por padrão**
- proxies reversos de loopback no mesmo host podem usar `gateway.trustedProxies` para detecção de cliente local e tratamento de IP encaminhado
- proxies reversos de loopback no mesmo host podem satisfazer `gateway.auth.mode: "trusted-proxy"` somente quando `gateway.auth.trustedProxy.allowLoopback = true`; caso contrário, use autenticação por token/senha

```yaml
gateway:
  trustedProxies:
    - "10.0.0.1" # reverse proxy IP
  # Optional. Default false.
  # Only enable if your proxy cannot provide X-Forwarded-For.
  allowRealIpFallback: false
  auth:
    mode: password
    password: ${OPENCLAW_GATEWAY_PASSWORD}
```

Quando `trustedProxies` está configurado, o Gateway usa `X-Forwarded-For` para determinar o IP do cliente. `X-Real-IP` é ignorado por padrão, a menos que `gateway.allowRealIpFallback: true` seja definido explicitamente.

Cabeçalhos de proxy confiável não tornam o pareamento de dispositivo de nó automaticamente confiável.
`gateway.nodes.pairing.autoApproveCidrs` é uma política de operador separada, desabilitada por padrão.
Mesmo quando habilitados, caminhos de cabeçalho trusted-proxy de origem loopback
são excluídos da aprovação automática de nós porque chamadores locais podem forjar esses
cabeçalhos, inclusive quando a autenticação trusted-proxy de loopback está explicitamente habilitada.

Bom comportamento de proxy reverso (sobrescrever cabeçalhos de encaminhamento recebidos):

```nginx
proxy_set_header X-Forwarded-For $remote_addr;
proxy_set_header X-Real-IP $remote_addr;
```

Mau comportamento de proxy reverso (anexar/preservar cabeçalhos de encaminhamento não confiáveis):

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## HSTS e notas de origem

- O Gateway do OpenClaw prioriza local/loopback. Se você encerrar TLS em um proxy reverso, defina HSTS ali no domínio HTTPS voltado para o proxy.
- Se o próprio Gateway encerrar HTTPS, você pode definir `gateway.http.securityHeaders.strictTransportSecurity` para emitir o cabeçalho HSTS a partir das respostas do OpenClaw.
- Orientações detalhadas de implantação estão em [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts).
- Para implantações da Control UI que não sejam loopback, `gateway.controlUi.allowedOrigins` é obrigatório por padrão.
- `gateway.controlUi.allowedOrigins: ["*"]` é uma política explícita de permitir todas as origens de navegador, não um padrão reforçado. Evite isso fora de testes locais rigidamente controlados.
- Falhas de autenticação de origem do navegador em loopback ainda têm limitação de taxa mesmo quando a
  isenção geral de loopback está habilitada, mas a chave de bloqueio tem escopo por
  valor `Origin` normalizado, em vez de um único bucket localhost compartilhado.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` habilita o modo de fallback de origem por cabeçalho Host; trate-o como uma política perigosa selecionada pelo operador.
- Trate DNS rebinding e comportamento de cabeçalho host de proxy como preocupações de reforço da implantação; mantenha `trustedProxies` restrito e evite expor o Gateway diretamente à internet pública.

## Logs de sessão locais ficam no disco

O OpenClaw armazena transcrições de sessão no disco em `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
Isso é necessário para continuidade da sessão e, opcionalmente, indexação de memória da sessão, mas também significa que
**qualquer processo/usuário com acesso ao sistema de arquivos pode ler esses logs**. Trate o acesso ao disco como o limite de confiança
e restrinja permissões em `~/.openclaw` (veja a seção de auditoria abaixo). Se você precisar de
isolamento mais forte entre agentes, execute-os sob usuários diferentes do SO ou em hosts separados.

## Execução de Node (system.run)

Se um nó macOS estiver pareado, o Gateway pode invocar `system.run` nesse nó. Isso é **execução remota de código** no Mac:

- Exige pareamento de nó (aprovação + token).
- O pareamento de nó do Gateway não é uma superfície de aprovação por comando. Ele estabelece identidade/confiança do nó e emissão de token.
- O Gateway aplica uma política global ampla de comandos de nó via `gateway.nodes.allowCommands` / `denyCommands`.
- Controlado no Mac via **Settings → Exec approvals** (segurança + perguntar + allowlist).
- A política `system.run` por nó é o arquivo próprio de aprovações de execução do nó (`exec.approvals.node.*`), que pode ser mais restrito ou mais permissivo que a política global de IDs de comando do Gateway.
- Um nó executando com `security="full"` e `ask="off"` está seguindo o modelo padrão de operador confiável. Trate isso como comportamento esperado, a menos que sua implantação exija explicitamente uma postura de aprovação ou allowlist mais rígida.
- O modo de aprovação vincula o contexto exato da solicitação e, quando possível, um operando concreto de script/arquivo local. Se o OpenClaw não conseguir identificar exatamente um arquivo local direto para um comando de interpretador/runtime, a execução baseada em aprovação será negada, em vez de prometer cobertura semântica completa.
- Para `host=node`, execuções baseadas em aprovação também armazenam um
  `systemRunPlan` preparado canônico; encaminhamentos aprovados posteriores reutilizam esse plano armazenado, e a validação do Gateway
  rejeita edições do chamador no contexto de comando/cwd/sessão depois que a
  solicitação de aprovação foi criada.
- Se você não quiser execução remota, defina a segurança como **deny** e remova o pareamento de nó desse Mac.

Essa distinção importa para a triagem:

- Um nó pareado que se reconecta anunciando uma lista de comandos diferente não é, por si só, uma vulnerabilidade se a política global do Gateway e as aprovações locais de execução do nó ainda impõem o limite real de execução.
- Relatórios que tratam metadados de pareamento de nó como uma segunda camada oculta de aprovação por comando geralmente são confusão de política/UX, não uma violação de limite de segurança.

## Skills dinâmicas (watcher / nós remotos)

O OpenClaw pode atualizar a lista de Skills no meio da sessão:

- **Watcher de Skills**: alterações em `SKILL.md` podem atualizar o snapshot de Skills no próximo turno do agente.
- **Nós remotos**: conectar um nó macOS pode tornar Skills exclusivas de macOS elegíveis (com base em sondagem de binários).

Trate pastas de Skills como **código confiável** e restrinja quem pode modificá-las.

## O modelo de ameaças

Seu assistente de IA pode:

- Executar comandos shell arbitrários
- Ler/gravar arquivos
- Acessar serviços de rede
- Enviar mensagens para qualquer pessoa (se você der acesso ao WhatsApp)

Pessoas que enviam mensagens para você podem:

- Tentar enganar sua IA para fazer coisas ruins
- Usar engenharia social para obter acesso aos seus dados
- Sondar detalhes de infraestrutura

## Conceito central: controle de acesso antes da inteligência

A maioria das falhas aqui não são exploits sofisticados - são "alguém enviou mensagem para o bot e o bot fez o que pediram."

A postura do OpenClaw:

- **Identidade primeiro:** decida quem pode falar com o bot (pareamento de DM / allowlists / "open" explícito).
- **Escopo depois:** decida onde o bot tem permissão para agir (allowlists de grupos + bloqueio por menção, ferramentas, sandboxing, permissões de dispositivo).
- **Modelo por último:** presuma que o modelo pode ser manipulado; projete para que a manipulação tenha raio de impacto limitado.

## Modelo de autorização de comandos

Comandos de barra e diretivas só são respeitados para **remetentes autorizados**. A autorização é derivada de
allowlists/pareamento de canal mais `commands.useAccessGroups` (veja [Configuração](/pt-BR/gateway/configuration)
e [Comandos de barra](/pt-BR/tools/slash-commands)). Se uma allowlist de canal estiver vazia ou incluir `"*"`,
os comandos ficam efetivamente abertos para esse canal.

`/exec` é uma conveniência somente de sessão para operadores autorizados. Ele **não** grava configuração nem
altera outras sessões.

## Risco das ferramentas do plano de controle

Duas ferramentas integradas podem fazer alterações persistentes no plano de controle:

- `gateway` pode inspecionar configuração com `config.schema.lookup` / `config.get`, e pode fazer alterações persistentes com `config.apply`, `config.patch` e `update.run`.
- `cron` pode criar jobs agendados que continuam rodando depois que o chat/tarefa original termina.

A ferramenta runtime `gateway` voltada ao agente ainda se recusa a reescrever
`tools.exec.ask` ou `tools.exec.security`; aliases legados `tools.bash.*` são
normalizados para os mesmos caminhos de execução protegidos antes da gravação.
Edições `gateway config.apply` e `gateway config.patch` conduzidas pelo agente são
fail-closed por padrão: apenas um conjunto estreito de ajustes de runtime de baixo risco,
bloqueio por menção e caminhos de resposta visível são ajustáveis pelo agente. Padrões globais de modelo
e sobreposições de prompt permanecem controlados pelo operador. Novas árvores de configuração sensíveis são,
portanto, protegidas, a menos que sejam deliberadamente adicionadas à allowlist.

Para qualquer agente/superfície que lide com conteúdo não confiável, negue estes por padrão:

```json5
{
  tools: {
    deny: ["gateway", "cron", "sessions_spawn", "sessions_send"],
  },
}
```

`commands.restart=false` bloqueia apenas ações de reinicialização. Ele não desabilita ações de configuração/atualização de `gateway`.

## Plugins

Plugins rodam **no mesmo processo** com o Gateway. Trate-os como código confiável:

- Instale Plugins apenas de fontes em que você confia.
- Prefira allowlists explícitas `plugins.allow`.
- Revise a configuração do Plugin antes de habilitar.
- Reinicie o Gateway depois de alterações em Plugins.
- Se você instalar ou atualizar Plugins (`openclaw plugins install <package>`, `openclaw plugins update <id>`), trate isso como executar código não confiável:
  - O caminho de instalação é o diretório por Plugin sob a raiz ativa de instalação de Plugins.
  - O OpenClaw não executa bloqueio local integrado de código perigoso durante instalação/atualização. Use `security.installPolicy` para decisões locais de permitir/bloquear pertencentes ao operador e `openclaw security audit --deep` para varredura diagnóstica.
  - Instalações de Plugins por npm e git executam convergência de dependências do gerenciador de pacotes apenas durante o fluxo explícito de instalação/atualização. Caminhos locais e arquivos compactados são tratados como pacotes de Plugin autocontidos; o OpenClaw os copia/referencia sem executar `npm install`.
  - Prefira versões fixadas e exatas (`@scope/pkg@1.2.3`) e inspecione o código descompactado no disco antes de habilitar.
  - `--dangerously-force-unsafe-install` está obsoleto e não altera mais o comportamento de instalação/atualização de Plugins.
  - Configure `security.installPolicy` quando operadores precisarem de um comando local confiável para tomar decisões de permitir/bloquear específicas do host para instalações de Skills e Plugins. Essa política roda depois que o material de origem é preparado, mas antes que a instalação continue, aplica-se também a Skills do ClawHub e não é contornada por flags inseguras obsoletas.

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Modelo de acesso por DM: pareamento, allowlist, aberto, desabilitado

Todos os canais atuais com suporte a DM aceitam uma política de DM (`dmPolicy` ou `*.dm.policy`) que bloqueia DMs recebidas **antes** que a mensagem seja processada:

- `pairing` (padrão): remetentes desconhecidos recebem um código curto de pareamento e o bot ignora a mensagem até ser aprovado. Códigos expiram após 1 hora; DMs repetidas não reenviarão um código até que uma nova solicitação seja criada. Solicitações pendentes são limitadas a **3 por canal** por padrão.
- `allowlist`: remetentes desconhecidos são bloqueados (sem handshake de pareamento).
- `open`: permite que qualquer pessoa envie DM (público). **Exige** que a allowlist do canal inclua `"*"` (adesão explícita).
- `disabled`: ignora totalmente DMs recebidas.

Aprove via CLI:

```bash
openclaw pairing list <channel>
openclaw pairing approve <channel> <code>
```

Detalhes + arquivos no disco: [Pareamento](/pt-BR/channels/pairing)

## Isolamento de sessão de DM (modo multiusuário)

Por padrão, o OpenClaw roteia **todas as DMs para a sessão principal** para que seu assistente tenha continuidade entre dispositivos e canais. Se **várias pessoas** puderem enviar DM para o bot (DMs abertas ou uma allowlist com várias pessoas), considere isolar sessões de DM:

```json5
{
  session: { dmScope: "per-channel-peer" },
}
```

Isso evita vazamento de contexto entre usuários, mantendo chats em grupo isolados.

Este é um limite de contexto de mensagens, não um limite de administrador de host. Se os usuários forem mutuamente adversariais e compartilharem o mesmo host/configuração do Gateway, execute gateways separados por limite de confiança.

### Modo de DM seguro (recomendado)

Trate o trecho acima como **modo de DM seguro**:

- Padrão: `session.dmScope: "main"` (todas as DMs compartilham uma sessão para continuidade).
- Padrão de onboarding da CLI local: grava `session.dmScope: "per-channel-peer"` quando não definido (mantém valores explícitos existentes).
- Modo de DM seguro: `session.dmScope: "per-channel-peer"` (cada par canal+remetente recebe um contexto de DM isolado).
- Isolamento de pares entre canais: `session.dmScope: "per-peer"` (cada remetente recebe uma sessão em todos os canais do mesmo tipo).

Se você roda várias contas no mesmo canal, use `per-account-channel-peer`. Se a mesma pessoa entra em contato com você em vários canais, use `session.identityLinks` para colapsar essas sessões de DM em uma identidade canônica. Veja [Gerenciamento de sessão](/pt-BR/concepts/session) e [Configuração](/pt-BR/gateway/configuration).

## Allowlists para DMs e grupos

O OpenClaw tem duas camadas separadas de "quem pode me acionar?":

- **Lista de permissões de DM** (`allowFrom` / `channels.discord.allowFrom` / `channels.slack.allowFrom`; legado: `channels.discord.dm.allowFrom`, `channels.slack.dm.allowFrom`): quem tem permissão para falar com o bot em mensagens diretas.
  - Quando `dmPolicy="pairing"`, as aprovações são gravadas no armazenamento de lista de permissões de pareamento com escopo de conta em `~/.openclaw/credentials/` (`<channel>-allowFrom.json` para a conta padrão, `<channel>-<accountId>-allowFrom.json` para contas não padrão), mescladas com listas de permissões da configuração.
- **Lista de permissões de grupos** (específica do canal): de quais grupos/canais/guildas o bot aceitará mensagens.
  - Padrões comuns:
    - `channels.whatsapp.groups`, `channels.telegram.groups`, `channels.imessage.groups`: padrões por grupo como `requireMention`; quando definido, também atua como lista de permissões de grupos (inclua `"*"` para manter o comportamento de permitir tudo).
    - `groupPolicy="allowlist"` + `groupAllowFrom`: restringe quem pode acionar o bot _dentro_ de uma sessão de grupo (WhatsApp/Telegram/Signal/iMessage/Microsoft Teams).
    - `channels.discord.guilds` / `channels.slack.channels`: listas de permissões por superfície + padrões de menção.
  - As verificações de grupo são executadas nesta ordem: `groupPolicy`/listas de permissões de grupo primeiro, ativação por menção/resposta depois.
  - Responder a uma mensagem do bot (menção implícita) **não** ignora listas de permissões de remetente como `groupAllowFrom`.
  - **Nota de segurança:** trate `dmPolicy="open"` e `groupPolicy="open"` como configurações de último recurso. Elas devem ser usadas raramente; prefira pareamento + listas de permissões, a menos que você confie totalmente em todos os membros da sala.

Detalhes: [Configuração](/pt-BR/gateway/configuration) e [Grupos](/pt-BR/channels/groups)

## Injeção de prompt (o que é, por que importa)

Injeção de prompt ocorre quando um invasor cria uma mensagem que manipula o modelo para fazer algo inseguro ("ignore suas instruções", "despeje seu sistema de arquivos", "siga este link e execute comandos" etc.).

Mesmo com prompts de sistema fortes, **injeção de prompt não está resolvida**. Barreiras de proteção no prompt de sistema são apenas orientação flexível; a aplicação rígida vem da política de ferramentas, aprovações de execução, sandboxing e listas de permissões de canal (e operadores podem desativá-las intencionalmente). O que ajuda na prática:

- Mantenha DMs recebidas bloqueadas (pareamento/listas de permissões).
- Prefira controle por menção em grupos; evite bots "sempre ativos" em salas públicas.
- Trate links, anexos e instruções coladas como hostis por padrão.
- Execute ferramentas sensíveis em um sandbox; mantenha segredos fora do sistema de arquivos acessível pelo agente.
- Observação: sandboxing é opcional. Se o modo sandbox estiver desativado, `host=auto` implícito resolve para o host do Gateway. `host=sandbox` explícito ainda falha fechado porque nenhum runtime de sandbox está disponível. Defina `host=gateway` se quiser que esse comportamento seja explícito na configuração.
- Limite ferramentas de alto risco (`exec`, `browser`, `web_fetch`, `web_search`) a agentes confiáveis ou listas de permissões explícitas.
- Se você colocar interpretadores em lista de permissões (`python`, `node`, `ruby`, `perl`, `php`, `lua`, `osascript`), habilite `tools.exec.strictInlineEval` para que formas de eval inline ainda precisem de aprovação explícita.
- A análise de aprovação de shell também rejeita formas de expansão de parâmetros POSIX (`$VAR`, `$?`, `$$`, `$1`, `$@`, `${…}`) dentro de **heredocs sem aspas**, então um corpo de heredoc em lista de permissões não consegue passar expansão de shell pela revisão da lista de permissões como texto simples. Coloque o terminador do heredoc entre aspas (por exemplo, `<<'EOF'`) para optar por semântica de corpo literal; heredocs sem aspas que teriam expandido variáveis são rejeitados.
- **A escolha do modelo importa:** modelos mais antigos/menores/legados são significativamente menos robustos contra injeção de prompt e uso indevido de ferramentas. Para agentes com ferramentas habilitadas, use o modelo mais forte de última geração, endurecido para instruções, disponível.

Sinais de alerta a tratar como não confiáveis:

- "Leia este arquivo/URL e faça exatamente o que ele diz."
- "Ignore seu prompt de sistema ou regras de segurança."
- "Revele suas instruções ocultas ou saídas de ferramentas."
- "Cole o conteúdo completo de ~/.openclaw ou dos seus logs."

## Sanitização de tokens especiais em conteúdo externo

O OpenClaw remove literais comuns de tokens especiais de modelos LLM auto-hospedados de template de chat do conteúdo externo encapsulado e dos metadados antes que cheguem ao modelo. As famílias de marcadores cobertas incluem Qwen/ChatML, Llama, Gemma, Mistral, Phi e tokens de papel/turno do GPT-OSS.

Por quê:

- Backends compatíveis com OpenAI que servem modelos auto-hospedados às vezes preservam tokens especiais que aparecem no texto do usuário, em vez de mascará-los. Um invasor que consiga escrever em conteúdo externo recebido (uma página buscada, o corpo de um e-mail, uma saída de ferramenta de conteúdo de arquivo) poderia, de outra forma, injetar uma fronteira sintética de papel `assistant` ou `system` e escapar das barreiras de proteção de conteúdo encapsulado.
- A sanitização acontece na camada de encapsulamento de conteúdo externo, então se aplica uniformemente a ferramentas de busca/leitura e conteúdo recebido por canais, em vez de ser por provedor.
- Respostas de saída do modelo já têm um sanitizador separado que remove `<tool_call>`, `<function_calls>`, `<system-reminder>`, `<previous_response>` e andaimes internos semelhantes de runtime vazados das respostas visíveis ao usuário na fronteira final de entrega do canal. O sanitizador de conteúdo externo é a contraparte de entrada.

Isso não substitui os outros endurecimentos desta página - `dmPolicy`, listas de permissões, aprovações de execução, sandboxing e `contextVisibility` ainda fazem o trabalho principal. Ele fecha um desvio específico na camada do tokenizer contra stacks auto-hospedadas que encaminham texto do usuário com tokens especiais intactos.

## Flags de desvio inseguro de conteúdo externo

O OpenClaw inclui flags explícitas de desvio que desativam o encapsulamento de segurança de conteúdo externo:

- `hooks.mappings[].allowUnsafeExternalContent`
- `hooks.gmail.allowUnsafeExternalContent`
- Campo de payload Cron `allowUnsafeExternalContent`

Orientação:

- Mantenha-as indefinidas/falsas em produção.
- Habilite apenas temporariamente para depuração com escopo bem restrito.
- Se habilitado, isole esse agente (sandbox + ferramentas mínimas + namespace de sessão dedicado).

Nota de risco de hooks:

- Payloads de hooks são conteúdo não confiável, mesmo quando a entrega vem de sistemas que você controla (conteúdo de e-mail/docs/web pode carregar injeção de prompt).
- Camadas de modelo fracas aumentam esse risco. Para automação acionada por hooks, prefira camadas de modelo modernas e fortes e mantenha a política de ferramentas restrita (`tools.profile: "messaging"` ou mais estrita), além de sandboxing quando possível.

### Injeção de prompt não exige DMs públicas

Mesmo que **apenas você** possa enviar mensagens ao bot, a injeção de prompt ainda pode acontecer por meio de
qualquer **conteúdo não confiável** que o bot leia (resultados de busca/busca web, páginas de navegador,
e-mails, docs, anexos, logs/código colados). Em outras palavras: o remetente não é
a única superfície de ameaça; o **conteúdo em si** pode carregar instruções adversariais.

Quando ferramentas estão habilitadas, o risco típico é exfiltrar contexto ou acionar
chamadas de ferramentas. Reduza o raio de impacto ao:

- Usar um **agente leitor** somente leitura ou com ferramentas desabilitadas para resumir conteúdo não confiável,
  depois passar o resumo ao seu agente principal.
- Manter `web_search` / `web_fetch` / `browser` desativados para agentes com ferramentas habilitadas, salvo necessidade.
- Para entradas de URL OpenResponses (`input_file` / `input_image`), defina
  `gateway.http.endpoints.responses.files.urlAllowlist` e
  `gateway.http.endpoints.responses.images.urlAllowlist` estritas, e mantenha `maxUrlParts` baixo.
  Listas de permissões vazias são tratadas como indefinidas; use `files.allowUrl: false` / `images.allowUrl: false`
  se quiser desativar completamente a busca de URLs.
- Para entradas de arquivo OpenResponses, o texto decodificado de `input_file` ainda é injetado como
  **conteúdo externo não confiável**. Não presuma que o texto do arquivo é confiável só porque
  o Gateway o decodificou localmente. O bloco injetado ainda carrega marcadores de fronteira explícitos
  `<<<EXTERNAL_UNTRUSTED_CONTENT ...>>>` mais metadados `Source: External`,
  embora esse caminho omita o banner mais longo `SECURITY NOTICE:`.
- O mesmo encapsulamento baseado em marcadores é aplicado quando a compreensão de mídia extrai texto
  de documentos anexados antes de anexar esse texto ao prompt de mídia.
- Habilitar sandboxing e listas de permissões de ferramentas estritas para qualquer agente que toque em entrada não confiável.
- Manter segredos fora dos prompts; passe-os via env/config no host do Gateway em vez disso.

### Backends LLM auto-hospedados

Backends auto-hospedados compatíveis com OpenAI, como vLLM, SGLang, TGI, LM Studio,
ou stacks personalizados de tokenizer Hugging Face podem diferir de provedores hospedados na forma como
tokens especiais de template de chat são tratados. Se um backend tokenizar strings literais
como `<|im_start|>`, `<|start_header_id|>` ou `<start_of_turn>` como
tokens estruturais de template de chat dentro do conteúdo do usuário, texto não confiável pode tentar
forjar fronteiras de papéis na camada do tokenizer.

O OpenClaw remove literais comuns de tokens especiais por família de modelo do
conteúdo externo encapsulado antes de despachá-lo ao modelo. Mantenha o encapsulamento de conteúdo externo
habilitado e prefira configurações de backend que separem ou escapem tokens especiais
em conteúdo fornecido pelo usuário quando disponíveis. Provedores hospedados como OpenAI
e Anthropic já aplicam sua própria sanitização no lado da solicitação.

### Força do modelo (nota de segurança)

A resistência a injeção de prompt **não** é uniforme entre camadas de modelo. Modelos menores/mais baratos geralmente são mais suscetíveis a uso indevido de ferramentas e sequestro de instruções, especialmente sob prompts adversariais.

<Warning>
Para agentes com ferramentas habilitadas ou agentes que leem conteúdo não confiável, o risco de injeção de prompt com modelos mais antigos/menores costuma ser alto demais. Não execute essas cargas de trabalho em camadas de modelo fracas.
</Warning>

Recomendações:

- **Use o modelo de última geração e melhor camada** para qualquer bot que possa executar ferramentas ou tocar em arquivos/redes.
- **Não use camadas antigas/mais fracas/menores** para agentes com ferramentas habilitadas ou caixas de entrada não confiáveis; o risco de injeção de prompt é alto demais.
- Se você precisar usar um modelo menor, **reduza o raio de impacto** (ferramentas somente leitura, sandboxing forte, acesso mínimo ao sistema de arquivos, listas de permissões estritas).
- Ao executar modelos pequenos, **habilite sandboxing para todas as sessões** e **desabilite web_search/web_fetch/browser**, a menos que as entradas sejam rigidamente controladas.
- Para assistentes pessoais apenas de chat com entrada confiável e sem ferramentas, modelos menores geralmente são adequados.

## Raciocínio e saída detalhada em grupos

`/reasoning`, `/verbose` e `/trace` podem expor raciocínio interno, saída de ferramentas
ou diagnósticos de Plugin que
não se destinavam a um canal público. Em ambientes de grupo, trate-os como **apenas depuração**
e mantenha-os desativados, a menos que você precise deles explicitamente.

Orientação:

- Mantenha `/reasoning`, `/verbose` e `/trace` desabilitados em salas públicas.
- Se você habilitá-los, faça isso apenas em DMs confiáveis ou salas rigidamente controladas.
- Lembre-se: saída detalhada e de trace pode incluir argumentos de ferramentas, URLs, diagnósticos de Plugin e dados que o modelo viu.

## Exemplos de endurecimento de configuração

### Permissões de arquivo

Mantenha configuração + estado privados no host do Gateway:

- `~/.openclaw/openclaw.json`: `600` (somente leitura/gravação pelo usuário)
- `~/.openclaw`: `700` (somente usuário)

`openclaw doctor` pode avisar e oferecer endurecer essas permissões.

### Exposição de rede (bind, porta, firewall)

O Gateway multiplexa **WebSocket + HTTP** em uma única porta:

- Padrão: `18789`
- Configuração/flags/env: `gateway.port`, `--port`, `OPENCLAW_GATEWAY_PORT`

Esta superfície HTTP inclui a Control UI e o host de canvas:

- Control UI (ativos SPA) (caminho base padrão `/`)
- Host de canvas: `/__openclaw__/canvas/` e `/__openclaw__/a2ui/` (HTML/JS arbitrário; trate como conteúdo não confiável)

Se você carregar conteúdo de canvas em um navegador normal, trate-o como qualquer outra página web não confiável:

- Não exponha o host de canvas a redes/usuários não confiáveis.
- Não faça o conteúdo de canvas compartilhar a mesma origem que superfícies web privilegiadas, a menos que você entenda totalmente as implicações.

O modo de bind controla onde o Gateway escuta:

- `gateway.bind: "loopback"` (padrão): somente clientes locais podem se conectar.
- Binds não loopback (`"lan"`, `"tailnet"`, `"custom"`) expandem a superfície de ataque. Use-os apenas com autenticação do Gateway (token/senha compartilhado ou um proxy confiável corretamente configurado) e um firewall real.

Regras gerais:

- Prefira Tailscale Serve a associações LAN (o Serve mantém o Gateway em loopback, e o Tailscale gerencia o acesso).
- Se você precisar associar à LAN, proteja a porta com firewall usando uma allowlist restrita de IPs de origem; não faça port-forward dela de forma ampla.
- Nunca exponha o Gateway sem autenticação em `0.0.0.0`.

### Publicação de portas do Docker com UFW

Se você executa o OpenClaw com Docker em uma VPS, lembre-se de que portas de contêiner publicadas
(`-p HOST:CONTAINER` ou `ports:` do Compose) são roteadas pelas cadeias de encaminhamento
do Docker, não apenas pelas regras `INPUT` do host.

Para manter o tráfego do Docker alinhado à sua política de firewall, aplique regras em
`DOCKER-USER` (essa cadeia é avaliada antes das regras de aceitação próprias do Docker).
Em muitas distribuições modernas, `iptables`/`ip6tables` usam o frontend `iptables-nft`
e ainda aplicam essas regras ao backend nftables.

Exemplo mínimo de allowlist (IPv4):

```bash
# /etc/ufw/after.rules (append as its own *filter section)
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

IPv6 tem tabelas separadas. Adicione uma política correspondente em `/etc/ufw/after6.rules` se
o IPv6 do Docker estiver habilitado.

Evite codificar nomes de interface como `eth0` nos trechos de documentação. Os nomes de interface
variam entre imagens de VPS (`ens3`, `enp*`, etc.) e incompatibilidades podem acidentalmente
pular sua regra de negação.

Validação rápida após recarregar:

```bash
ufw reload
iptables -S DOCKER-USER
ip6tables -S DOCKER-USER
nmap -sT -p 1-65535 <public-ip> --open
```

As portas externas esperadas devem ser apenas as que você expõe intencionalmente (para a maioria
das configurações: SSH + as portas do seu proxy reverso).

### Descoberta mDNS/Bonjour

Quando o Plugin `bonjour` incluído está habilitado, o Gateway anuncia sua presença via mDNS (`_openclaw-gw._tcp` na porta 5353) para descoberta de dispositivos locais. No modo completo, isso inclui registros TXT que podem expor detalhes operacionais:

- `cliPath`: caminho completo do sistema de arquivos para o binário da CLI (revela nome de usuário e local de instalação)
- `sshPort`: anuncia disponibilidade de SSH no host
- `displayName`, `lanHost`: informações de hostname

**Consideração de segurança operacional:** Anunciar detalhes de infraestrutura facilita o reconhecimento por qualquer pessoa na rede local. Até informações "inofensivas", como caminhos do sistema de arquivos e disponibilidade de SSH, ajudam atacantes a mapear seu ambiente.

**Recomendações:**

1. **Mantenha o Bonjour desabilitado, a menos que a descoberta em LAN seja necessária.** O Bonjour inicia automaticamente em hosts macOS e é opcional nos demais; URLs diretas do Gateway, Tailnet, SSH ou DNS-SD de área ampla evitam multicast local.

2. **Modo mínimo** (padrão quando o Bonjour está habilitado, recomendado para gateways expostos): omita campos sensíveis dos anúncios mDNS:

   ```json5
   {
     discovery: {
       mdns: { mode: "minimal" },
     },
   }
   ```

3. **Desabilite o modo mDNS** se quiser manter o Plugin habilitado, mas suprimir a descoberta de dispositivos locais:

   ```json5
   {
     discovery: {
       mdns: { mode: "off" },
     },
   }
   ```

4. **Modo completo** (opcional): inclua `cliPath` + `sshPort` nos registros TXT:

   ```json5
   {
     discovery: {
       mdns: { mode: "full" },
     },
   }
   ```

5. **Variável de ambiente** (alternativa): defina `OPENCLAW_DISABLE_BONJOUR=1` para desabilitar mDNS sem alterações de configuração.

Quando o Bonjour está habilitado no modo mínimo, o Gateway anuncia o suficiente para descoberta de dispositivos (`role`, `gatewayPort`, `transport`), mas omite `cliPath` e `sshPort`. Aplicativos que precisam de informações do caminho da CLI podem obtê-las pela conexão WebSocket autenticada.

### Restrinja o WebSocket do Gateway (autenticação local)

A autenticação do Gateway é **obrigatória por padrão**. Se nenhum caminho válido de autenticação do gateway estiver configurado,
o Gateway recusa conexões WebSocket (falha fechada).

O onboarding gera um token por padrão (mesmo para loopback), portanto
clientes locais devem se autenticar.

Defina um token para que **todos** os clientes WS precisem se autenticar:

```json5
{
  gateway: {
    auth: { mode: "token", token: "your-token" },
  },
}
```

O doctor pode gerar um para você: `openclaw doctor --generate-gateway-token`.

<Note>
`gateway.remote.token` e `gateway.remote.password` são fontes de credenciais de cliente. Eles **não** protegem o acesso WS local por si só. Caminhos de chamada locais podem usar `gateway.remote.*` como fallback apenas quando `gateway.auth.*` não está definido. Se `gateway.auth.token` ou `gateway.auth.password` estiver explicitamente configurado via SecretRef e não resolvido, a resolução falha fechada (sem mascaramento por fallback remoto).
</Note>
Opcional: fixe o TLS remoto com `gateway.remote.tlsFingerprint` ao usar `wss://`.
`ws://` em texto claro é aceito para loopback, literais de IP privado, `.local` e
URLs de gateway Tailnet `*.ts.net`. Para outros nomes DNS privados confiáveis, defina
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` no processo cliente como medida emergencial.
Isso é intencionalmente apenas ambiente de processo, não uma chave de configuração
`openclaw.json`.
O pareamento móvel e rotas de gateway manuais ou escaneadas no Android são mais estritos:
texto claro é aceito para loopback, mas LAN privada, link-local, `.local` e
hostnames sem ponto devem usar TLS, a menos que você opte explicitamente pelo caminho
de texto claro de rede privada confiável.

Pareamento de dispositivo local:

- O pareamento de dispositivo é aprovado automaticamente para conexões diretas de local loopback para manter
  clientes no mesmo host sem atrito.
- O OpenClaw também tem um caminho estreito de autoconexão local de backend/contêiner para
  fluxos auxiliares confiáveis com segredo compartilhado.
- Conexões por Tailnet e LAN, incluindo associações tailnet no mesmo host, são tratadas como
  remotas para pareamento e ainda precisam de aprovação.
- Evidência de cabeçalho encaminhado em uma solicitação de loopback desqualifica a
  localidade de loopback. A aprovação automática de upgrade de metadados tem escopo estreito. Veja
  [Pareamento do Gateway](/pt-BR/gateway/pairing) para ambas as regras.

Modos de autenticação:

- `gateway.auth.mode: "token"`: token bearer compartilhado (recomendado para a maioria das configurações).
- `gateway.auth.mode: "password"`: autenticação por senha (prefira definir via env: `OPENCLAW_GATEWAY_PASSWORD`).
- `gateway.auth.mode: "trusted-proxy"`: confia em um proxy reverso ciente de identidade para autenticar usuários e passar identidade via cabeçalhos (veja [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth)).

Checklist de rotação (token/senha):

1. Gere/defina um novo segredo (`gateway.auth.token` ou `OPENCLAW_GATEWAY_PASSWORD`).
2. Reinicie o Gateway (ou reinicie o aplicativo macOS se ele supervisiona o Gateway).
3. Atualize quaisquer clientes remotos (`gateway.remote.token` / `.password` em máquinas que chamam o Gateway).
4. Verifique que você não consegue mais se conectar com as credenciais antigas.

### Cabeçalhos de identidade do Tailscale Serve

Quando `gateway.auth.allowTailscale` é `true` (padrão para Serve), o OpenClaw
aceita cabeçalhos de identidade do Tailscale Serve (`tailscale-user-login`) para autenticação da UI de controle/WebSocket. O OpenClaw verifica a identidade resolvendo o
endereço `x-forwarded-for` pelo daemon local do Tailscale (`tailscale whois`)
e comparando-o ao cabeçalho. Isso só é acionado para solicitações que atingem o loopback
e incluem `x-forwarded-for`, `x-forwarded-proto` e `x-forwarded-host` conforme
injetados pelo Tailscale.
Para esse caminho assíncrono de verificação de identidade, tentativas com falha para o mesmo `{scope, ip}`
são serializadas antes que o limitador registre a falha. Retentativas ruins simultâneas
de um cliente Serve podem, portanto, bloquear a segunda tentativa imediatamente
em vez de passar em corrida como duas incompatibilidades simples.
Endpoints da API HTTP (por exemplo `/v1/*`, `/tools/invoke` e `/api/channels/*`)
**não** usam autenticação por cabeçalho de identidade do Tailscale. Eles ainda seguem o modo de autenticação HTTP
configurado do gateway.

Observação importante de limite:

- A autenticação bearer HTTP do Gateway é, na prática, acesso de operador tudo ou nada.
- Trate credenciais que podem chamar `/v1/chat/completions`, `/v1/responses`, rotas de Plugin como `/api/v1/admin/rpc` ou `/api/channels/*` como segredos de operador com acesso total para esse gateway.
- Na superfície HTTP compatível com OpenAI, autenticação bearer com segredo compartilhado restaura todos os escopos padrão de operador (`operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`) e semânticas de proprietário para turnos de agente; valores `x-openclaw-scopes` mais restritos não reduzem esse caminho de segredo compartilhado.
- Semânticas de escopo por solicitação em HTTP só se aplicam quando a solicitação vem de um modo com identidade, como autenticação por proxy confiável, ou de uma entrada privada explicitamente sem autenticação.
- Nesses modos com identidade, omitir `x-openclaw-scopes` volta ao conjunto normal de escopos padrão de operador; envie o cabeçalho explicitamente quando quiser um conjunto de escopos mais restrito. Cabeçalhos compatíveis com OpenAI em nível de proprietário, como `x-openclaw-model`, exigem `operator.admin` quando os escopos são restringidos.
- `/tools/invoke` e endpoints HTTP de histórico de sessão seguem a mesma regra de segredo compartilhado: autenticação bearer por token/senha também é tratada como acesso total de operador ali, enquanto modos com identidade ainda respeitam escopos declarados.
- Não compartilhe essas credenciais com chamadores não confiáveis; prefira gateways separados por limite de confiança.

**Premissa de confiança:** autenticação Serve sem token presume que o host do gateway é confiável.
Não trate isso como proteção contra processos hostis no mesmo host. Se código local não confiável
puder ser executado no host do gateway, desabilite `gateway.auth.allowTailscale`
e exija autenticação explícita por segredo compartilhado com `gateway.auth.mode: "token"` ou
`"password"`.

**Regra de segurança:** não encaminhe esses cabeçalhos a partir do seu próprio proxy reverso. Se
você termina TLS ou usa proxy na frente do gateway, desabilite
`gateway.auth.allowTailscale` e use autenticação por segredo compartilhado (`gateway.auth.mode:
"token"` ou `"password"`) ou [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth)
em vez disso.

Proxies confiáveis:

- Se você termina TLS na frente do Gateway, defina `gateway.trustedProxies` como os IPs do seu proxy.
- O OpenClaw confiará em `x-forwarded-for` (ou `x-real-ip`) desses IPs para determinar o IP do cliente em verificações de pareamento local e autenticação HTTP/verificações locais.
- Garanta que seu proxy **sobrescreva** `x-forwarded-for` e bloqueie acesso direto à porta do Gateway.

Veja [Tailscale](/pt-BR/gateway/tailscale) e [Visão geral da Web](/pt-BR/web).

### Controle do navegador via host de nó (recomendado)

Se o seu Gateway é remoto, mas o navegador roda em outra máquina, execute um **host de nó**
na máquina do navegador e deixe o Gateway intermediar ações do navegador (veja [Ferramenta de navegador](/pt-BR/tools/browser)).
Trate o pareamento de nó como acesso administrativo.

Padrão recomendado:

- Mantenha o Gateway e o host de nó na mesma tailnet (Tailscale).
- Faça o pareamento do nó intencionalmente; desabilite o roteamento de proxy do navegador se não precisar dele.

Evite:

- Expor portas de relay/controle pela LAN ou Internet pública.
- Tailscale Funnel para endpoints de controle do navegador (exposição pública).

### Segredos em disco

Presuma que qualquer coisa em `~/.openclaw/` (ou `$OPENCLAW_STATE_DIR/`) pode conter segredos ou dados privados:

- `openclaw.json`: a configuração pode incluir tokens (gateway, gateway remoto), configurações de provedores e allowlists.
- `credentials/**`: credenciais de canal (exemplo: credenciais do WhatsApp), allowlists de pareamento, importações OAuth legadas.
- `agents/<agentId>/agent/auth-profiles.json`: chaves de API, perfis de token, tokens OAuth e `keyRef`/`tokenRef` opcionais.
- `agents/<agentId>/agent/codex-home/**`: conta, configuração, Skills, plugins, estado nativo de threads e diagnósticos do servidor de aplicativo Codex por agente.
- `secrets.json` (opcional): payload de segredo baseado em arquivo usado por provedores SecretRef `file` (`secrets.providers`).
- `agents/<agentId>/agent/auth.json`: arquivo de compatibilidade legado. Entradas estáticas `api_key` são expurgadas quando descobertas.
- `agents/<agentId>/sessions/**`: transcrições de sessão (`*.jsonl`) + metadados de roteamento (`sessions.json`) que podem conter mensagens privadas e saída de ferramentas.
- pacotes de Plugin incluídos: plugins instalados (mais seus `node_modules/`).
- `sandboxes/**`: workspaces de sandbox de ferramentas; podem acumular cópias de arquivos que você lê/escreve dentro do sandbox.

Dicas de hardening:

- Mantenha permissões restritas (`700` em dirs, `600` em arquivos).
- Use criptografia de disco completo no host do Gateway.
- Prefira uma conta de usuário dedicada do SO para o Gateway se o host for compartilhado.

### Arquivos `.env` do espaço de trabalho

O OpenClaw carrega arquivos `.env` locais do espaço de trabalho para agentes e ferramentas, mas nunca permite que esses arquivos sobrescrevam silenciosamente os controles de runtime do gateway.

- Variáveis de ambiente de credenciais de provedores são bloqueadas em arquivos `.env` não confiáveis do espaço de trabalho. Exemplos incluem `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `PERPLEXITY_API_KEY`, `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `FIRECRAWL_API_KEY` e chaves de autenticação de provedores declaradas por plugins confiáveis instalados. Coloque credenciais de provedores no ambiente do processo do Gateway, em `~/.openclaw/.env` (`$OPENCLAW_STATE_DIR/.env`), no bloco `env` da configuração ou na importação opcional do shell de login.
- Qualquer chave que comece com `OPENCLAW_*` é bloqueada em arquivos `.env` não confiáveis do espaço de trabalho.
- Configurações de endpoint de canais para Matrix, Mattermost, IRC e Synology Chat também são bloqueadas contra sobrescritas de `.env` do espaço de trabalho, para que espaços de trabalho clonados não possam redirecionar tráfego de conectores incluídos por meio de configuração de endpoint local. Chaves de env de endpoint (como `MATRIX_HOMESERVER`, `MATTERMOST_URL`, `IRC_HOST`, `SYNOLOGY_CHAT_INCOMING_URL`) devem vir do ambiente do processo do gateway ou de `env.shellEnv`, não de um `.env` carregado do espaço de trabalho.
- O bloqueio é fail-closed: uma nova variável de controle de runtime adicionada em uma versão futura não pode ser herdada de um `.env` versionado ou fornecido por atacante; a chave é ignorada e o gateway mantém seu próprio valor.
- Variáveis de ambiente confiáveis do processo/SO, dotenv global de runtime, configuração `env` e importação de shell de login habilitada ainda se aplicam - isto restringe apenas o carregamento de arquivos `.env` do espaço de trabalho.

Por quê: arquivos `.env` do espaço de trabalho frequentemente ficam ao lado do código de agentes, são commitados por acidente ou são escritos por ferramentas. Bloquear credenciais de provedores impede que um espaço de trabalho clonado substitua contas de provedor controladas por atacante. Bloquear todo o prefixo `OPENCLAW_*` significa que adicionar uma nova flag `OPENCLAW_*` depois nunca pode regredir para herança silenciosa do estado do espaço de trabalho.

### Logs e transcrições (redação e retenção)

Logs e transcrições podem vazar informações sensíveis mesmo quando os controles de acesso estão corretos:

- Logs do Gateway podem incluir resumos de ferramentas, erros e URLs.
- Transcrições de sessão podem incluir segredos colados, conteúdos de arquivos, saída de comandos e links.

Recomendações:

- Mantenha a redação de logs e transcrições ativada (`logging.redactSensitive: "tools"`; padrão).
- Adicione padrões personalizados para seu ambiente via `logging.redactPatterns` (tokens, hostnames, URLs internas).
- Ao compartilhar diagnósticos, prefira `openclaw status --all` (colável, segredos redigidos) em vez de logs brutos.
- Remova transcrições de sessão e arquivos de log antigos se você não precisar de retenção longa.

Detalhes: [Logging](/pt-BR/gateway/logging)

### DMs: pareamento por padrão

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

Em chats de grupo, responda apenas quando mencionado explicitamente.

### Números separados (WhatsApp, Signal, Telegram)

Para canais baseados em número de telefone, considere executar sua IA em um número de telefone separado do seu pessoal:

- Número pessoal: suas conversas permanecem privadas
- Número do bot: a IA lida com estas, com limites apropriados

### Modo somente leitura (via sandbox e ferramentas)

Você pode criar um perfil somente leitura combinando:

- `agents.defaults.sandbox.workspaceAccess: "ro"` (ou `"none"` para nenhum acesso ao espaço de trabalho)
- listas de permissão/bloqueio de ferramentas que bloqueiam `write`, `edit`, `apply_patch`, `exec`, `process` etc.

Opções adicionais de endurecimento:

- `tools.exec.applyPatch.workspaceOnly: true` (padrão): garante que `apply_patch` não possa escrever/excluir fora do diretório do espaço de trabalho mesmo quando o sandboxing está desativado. Defina como `false` apenas se você intencionalmente quiser que `apply_patch` toque arquivos fora do espaço de trabalho.
- `tools.fs.workspaceOnly: true` (opcional): restringe caminhos de `read`/`write`/`edit`/`apply_patch` e caminhos de carregamento automático de imagem de prompt nativo ao diretório do espaço de trabalho (útil se você permite caminhos absolutos hoje e quer uma única proteção).
- Mantenha raízes do sistema de arquivos restritas: evite raízes amplas como seu diretório inicial para espaços de trabalho de agentes/espaços de trabalho de sandbox. Raízes amplas podem expor arquivos locais sensíveis (por exemplo, estado/configuração em `~/.openclaw`) a ferramentas de sistema de arquivos.

### Linha de base segura (copiar/colar)

Uma configuração de "padrão seguro" que mantém o Gateway privado, exige pareamento de DM e evita bots de grupo sempre ativos:

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

Se você também quiser execução de ferramentas "mais segura por padrão", adicione um sandbox + bloqueie ferramentas perigosas para qualquer agente que não seja proprietário (exemplo abaixo em "Perfis de acesso por agente").

Linha de base integrada para turnos de agente conduzidos por chat: remetentes que não são proprietários não podem usar as ferramentas `cron` ou `gateway`.

## Sandboxing (recomendado)

Doc dedicada: [Sandboxing](/pt-BR/gateway/sandboxing)

Duas abordagens complementares:

- **Executar o Gateway completo no Docker** (limite do contêiner): [Docker](/pt-BR/install/docker)
- **Sandbox de ferramentas** (`agents.defaults.sandbox`, gateway do host + ferramentas isoladas por sandbox; Docker é o backend padrão): [Sandboxing](/pt-BR/gateway/sandboxing)

<Note>
Para impedir acesso entre agentes, mantenha `agents.defaults.sandbox.scope` em `"agent"` (padrão) ou `"session"` para isolamento mais rigoroso por sessão. `scope: "shared"` usa um único contêiner ou espaço de trabalho.
</Note>

Considere também o acesso ao espaço de trabalho do agente dentro do sandbox:

- `agents.defaults.sandbox.workspaceAccess: "none"` (padrão) mantém o espaço de trabalho do agente fora dos limites; ferramentas rodam contra um espaço de trabalho de sandbox em `~/.openclaw/sandboxes`
- `agents.defaults.sandbox.workspaceAccess: "ro"` monta o espaço de trabalho do agente como somente leitura em `/agent` (desabilita `write`/`edit`/`apply_patch`)
- `agents.defaults.sandbox.workspaceAccess: "rw"` monta o espaço de trabalho do agente como leitura/gravação em `/workspace`
- `sandbox.docker.binds` extras são validados contra caminhos de origem normalizados e canonicalizados. Truques de symlink pai e aliases canônicos da home ainda falham fechados se resolverem para raízes bloqueadas como `/etc`, `/var/run` ou diretórios de credenciais sob a home do SO.

<Warning>
`tools.elevated` é a válvula de escape de linha de base global que executa exec fora do sandbox. O host efetivo é `gateway` por padrão, ou `node` quando o alvo de exec está configurado como `node`. Mantenha `tools.elevated.allowFrom` restrito e não o habilite para desconhecidos. Você pode restringir ainda mais elevated por agente via `agents.list[].tools.elevated`. Consulte [Modo elevado](/pt-BR/tools/elevated).
</Warning>

### Proteção para delegação de subagente

Se você permite ferramentas de sessão, trate execuções delegadas de subagente como outra decisão de limite:

- Bloqueie `sessions_spawn` a menos que o agente realmente precise de delegação.
- Mantenha `agents.defaults.subagents.allowAgents` e quaisquer sobrescritas por agente de `agents.list[].subagents.allowAgents` restritas a agentes-alvo sabidamente seguros.
- Para qualquer fluxo de trabalho que precise permanecer em sandbox, chame `sessions_spawn` com `sandbox: "require"` (o padrão é `inherit`).
- `sandbox: "require"` falha rapidamente quando o runtime filho alvo não está em sandbox.

## Riscos do controle do navegador

Habilitar o controle do navegador dá ao modelo a capacidade de controlar um navegador real.
Se esse perfil de navegador já contiver sessões logadas, o modelo pode
acessar essas contas e dados. Trate perfis de navegador como **estado sensível**:

- Prefira um perfil dedicado para o agente (o perfil padrão `openclaw`).
- Evite apontar o agente para seu perfil pessoal de uso diário.
- Mantenha o controle do navegador do host desabilitado para agentes em sandbox, a menos que você confie neles.
- A API autônoma de controle do navegador por local loopback só respeita autenticação por segredo compartilhado
  (autenticação bearer por token do gateway ou senha do gateway). Ela não consome
  cabeçalhos de identidade de trusted-proxy ou Tailscale Serve.
- Trate downloads do navegador como entrada não confiável; prefira um diretório de downloads isolado.
- Desative sincronização do navegador/gerenciadores de senha no perfil do agente se possível (reduz o raio de impacto).
- Para gateways remotos, assuma que "controle do navegador" é equivalente a "acesso de operador" a tudo que esse perfil consegue alcançar.
- Mantenha os hosts do Gateway e node apenas na tailnet; evite expor portas de controle do navegador à LAN ou à Internet pública.
- Desative roteamento de proxy do navegador quando você não precisar dele (`gateway.nodes.browser.mode="off"`).
- O modo de sessão existente do Chrome MCP **não** é "mais seguro"; ele pode agir como você em tudo que aquele perfil Chrome do host consegue alcançar.

### Política SSRF do navegador (estrita por padrão)

A política de navegação do navegador do OpenClaw é estrita por padrão: destinos privados/internos permanecem bloqueados a menos que você opte explicitamente por permiti-los.

- Padrão: `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` não está definido, então a navegação do navegador mantém destinos privados/internos/de uso especial bloqueados.
- Alias legado: `browser.ssrfPolicy.allowPrivateNetwork` ainda é aceito por compatibilidade.
- Modo opt-in: defina `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` para permitir destinos privados/internos/de uso especial.
- No modo estrito, use `hostnameAllowlist` (padrões como `*.example.com`) e `allowedHostnames` (exceções exatas de host, incluindo nomes bloqueados como `localhost`) para exceções explícitas.
- A navegação é verificada antes da solicitação e reverificada em melhor esforço na URL `http(s)` final após a navegação para reduzir pivôs baseados em redirecionamento.

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

Com roteamento multiagente, cada agente pode ter sua própria política de sandbox + ferramentas:
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

### Exemplo: ferramentas somente leitura + espaço de trabalho somente leitura

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

### Exemplo: nenhum acesso a sistema de arquivos/shell (mensagens de provedor permitidas)

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
        // Session tools can reveal sensitive data from transcripts. By default OpenClaw limits these tools
        // to the current session + spawned subagent sessions, but you can clamp further if needed.
        // See `tools.sessions.visibility` in the configuration reference.
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

1. **Pare-a:** pare o aplicativo macOS (se ele supervisiona o Gateway) ou encerre seu processo `openclaw gateway`.
2. **Feche a exposição:** defina `gateway.bind: "loopback"` (ou desative Tailscale Funnel/Serve) até entender o que aconteceu.
3. **Congele o acesso:** altere DMs/grupos arriscados para `dmPolicy: "disabled"` / exija menções, e remova entradas `"*"` de permitir tudo, se você as tiver.

### Rotacionar (presuma comprometimento se segredos vazaram)

1. Rotacione a autenticação do Gateway (`gateway.auth.token` / `OPENCLAW_GATEWAY_PASSWORD`) e reinicie.
2. Rotacione os segredos de clientes remotos (`gateway.remote.token` / `.password`) em qualquer máquina que possa chamar o Gateway.
3. Rotacione credenciais de provedores/API (credenciais do WhatsApp, tokens do Slack/Discord, chaves de modelo/API em `auth-profiles.json` e valores de payloads de segredos criptografados quando usados).

### Auditar

1. Verifique os logs do Gateway: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (ou `logging.file`).
2. Revise as transcrições relevantes: `~/.openclaw/agents/<agentId>/sessions/*.jsonl`.
3. Revise alterações recentes de configuração (qualquer coisa que possa ter ampliado o acesso: `gateway.bind`, `gateway.auth`, políticas de DM/grupo, `tools.elevated`, alterações de plugin).
4. Execute novamente `openclaw security audit --deep` e confirme que achados críticos foram resolvidos.

### Coletar para um relatório

- Carimbo de data/hora, sistema operacional do host do gateway + versão do OpenClaw
- As transcrições da sessão + um breve trecho final do log (após redação)
- O que o invasor enviou + o que o agente fez
- Se o Gateway foi exposto além de loopback (LAN/Tailscale Funnel/Serve)

## Varredura de segredos

A CI executa o hook pre-commit `detect-private-key` no repositório. Se ele
falhar, remova ou rotacione o material de chave commitado e então reproduza localmente:

```bash
pre-commit run --all-files detect-private-key
```

## Relatar problemas de segurança

Encontrou uma vulnerabilidade no OpenClaw? Relate com responsabilidade:

1. Email: [security@openclaw.ai](mailto:security@openclaw.ai)
2. Não publique publicamente até que seja corrigida
3. Daremos crédito a você (a menos que prefira anonimato)
