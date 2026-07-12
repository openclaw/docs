---
read_when:
    - Exposição do Gateway via LAN, tailnet, Tailscale Serve, Funnel ou proxy reverso
    - Revisando uma implantação antes de permitir usuários reais de mensagens
    - Revertendo uma configuração arriscada de acesso remoto ou de mensagens diretas
sidebarTitle: Exposure runbook
summary: Lista de verificação prévia e de reversão antes de expor um Gateway do OpenClaw além do local loopback
title: Runbook de exposição do Gateway
x-i18n:
    generated_at: "2026-07-12T00:00:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Exponha o Gateway somente depois de conseguir explicar quem pode acessá-lo, como essas pessoas são
autenticadas, quais agentes podem acionar e quais ferramentas esses agentes podem
usar. Em caso de dúvida, retorne ao acesso restrito ao local loopback e execute a auditoria novamente.
</Warning>

Este guia operacional transforma as orientações mais abrangentes de [Segurança](/pt-BR/gateway/security) em uma
lista de verificação para operadores sobre acesso remoto e exposição de mensagens.

## Escolha o padrão de exposição

Prefira o padrão mais restrito que atenda ao fluxo de trabalho.

| Padrão                     | Recomendado quando                                        | Controles obrigatórios                                                                                                                        |
| -------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Local loopback + túnel SSH | Uso pessoal, acesso administrativo, depuração             | Mantenha `gateway.bind: "loopback"` e crie um túnel para `127.0.0.1:18789`                                                                     |
| Local loopback + Tailscale Serve | Acesso pela tailnet pessoal à interface de controle/WebSocket | Mantenha o Gateway restrito ao local loopback; os cabeçalhos de identidade do Tailscale autenticam somente a superfície WebSocket da interface de controle, não outros caminhos de autenticação |
| Vinculação à tailnet/LAN   | Rede privada dedicada com dispositivos conhecidos         | Autenticação do Gateway, lista de permissões do firewall e nenhum encaminhamento de porta pública                                              |
| Proxy reverso confiável    | SSO/OIDC da organização na frente do Gateway              | Autenticação `trusted-proxy`, `trustedProxies` estritos, regras para sobrescrever/remover cabeçalhos e usuários permitidos explicitamente       |
| Internet pública           | Implantações raras e de alto risco                        | Proxy com reconhecimento de identidade, TLS, limites de taxa, listas de permissões estritas e sessões não principais em sandbox                 |

Evite o encaminhamento direto de portas públicas para o Gateway. Se o acesso público for
necessário, coloque um proxy com reconhecimento de identidade na frente dele e torne o proxy o
único caminho de rede até o Gateway.

## Inventário preliminar

Registre estas informações antes de alterar a vinculação, o proxy, o Tailscale ou a política de canais:

- Host do Gateway, usuário do sistema operacional e diretório de estado (padrão: `~/.openclaw`).
- URL e modo de vinculação do Gateway (`gateway.bind`; porta padrão: `18789`).
- Modo de autenticação, origem do token/senha ou origem da identidade do proxy confiável.
- Todos os canais habilitados e se aceitam mensagens diretas, grupos ou webhooks.
- Agentes acessíveis por remetentes não locais.
- Perfil de ferramentas, modo de sandbox e política de ferramentas elevadas para cada agente acessível.
- Credenciais externas disponíveis para esses agentes.
- Local do backup de `~/.openclaw/openclaw.json` e das credenciais.

Se mais de uma pessoa puder enviar mensagens ao bot, trate isso como autoridade compartilhada e delegada
sobre ferramentas, não como isolamento do host por usuário.

## Verificações básicas

Execute antes de liberar o acesso:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Resolva primeiro as constatações críticas. Aceite avisos somente quando forem intencionais e
documentados para a implantação. Consulte [Verificações da auditoria de segurança](/pt-BR/gateway/security/audit-checks)
para saber o significado de cada `checkId` e sua chave de correção.

Para validação remota pela CLI, forneça as credenciais explicitamente:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Não presuma que as credenciais da configuração local se aplicam a uma URL remota explícita.

## Configuração mínima segura

Use esta estrutura como ponto de partida para implantações expostas:

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Amplie um controle por vez: adicione uma lista de permissões específica do canal antes de habilitar
ferramentas com capacidade de escrita ou habilite um proxy reverso antes de aceitar tráfego remoto da
interface de controle.

`tools.exec.security: "deny"` bloqueia todas as chamadas de execução, inclusive diagnósticos
inofensivos. Se diagnósticos ou comandos de baixo risco forem necessários, flexibilize essa opção somente
depois de escolher os remetentes, agentes, comandos e o modo de aprovação específicos que
correspondam ao seu modelo de ameaças.

## Exposição de mensagens diretas e grupos

Os canais de mensagens são superfícies de entrada não confiáveis. Antes de permitir mensagens diretas ou
grupos:

- Prefira `dmPolicy: "pairing"` ou uma lista `allowFrom` estrita em vez de `dmPolicy: "open"`.
- Não combine listas de permissões com `"*"` e acesso amplo a ferramentas.
- Exija menções em grupos, a menos que a sala seja rigorosamente controlada.
- Defina `session.dmScope: "per-channel-peer"` (ou `"per-account-channel-peer"` para
  canais com várias contas) quando várias pessoas puderem enviar mensagens diretas ao bot, para que as sessões de mensagens diretas
  não compartilhem contexto.
- Encaminhe canais compartilhados para agentes com o mínimo de ferramentas e sem credenciais
  pessoais.

O pareamento autoriza o remetente a acionar o bot. Ele não transforma esse remetente em um
limite de segurança separado no host.

## Verificações do proxy reverso

Para proxies com reconhecimento de identidade:

- O proxy deve autenticar os usuários antes de encaminhar as solicitações ao Gateway.
- O firewall ou a política de rede deve bloquear o acesso direto à porta do Gateway.
- `gateway.trustedProxies` deve listar somente os IPs de origem do proxy.
- O proxy deve remover ou sobrescrever cabeçalhos de identidade e encaminhamento
  fornecidos pelo cliente.
- Defina `gateway.auth.trustedProxy.allowUsers` quando o proxy atender a mais de
  um público.
- Use `gateway.auth.trustedProxy.allowLoopback` somente para um proxy no mesmo host
  em que os processos locais sejam confiáveis e o proxy seja responsável pelos cabeçalhos de identidade.

Execute `openclaw security audit --deep` após alterações no proxy. As constatações relacionadas a proxies
confiáveis são altamente relevantes porque o proxy se torna o limite de
autenticação.

## Análise de ferramentas e sandbox

Antes de expor um agente a remetentes remotos:

- Confirme quais sessões são executadas no host e quais são executadas na sandbox.
- Negue ou exija aprovação para execução no host.
- Mantenha as ferramentas elevadas desabilitadas, a menos que um remetente específico e confiável precise delas.
- Evite ferramentas de navegador, canvas, Node, Cron, Gateway e criação de sessões em superfícies de mensagens
  abertas ou semiabertas.
- Mantenha as montagens vinculadas restritas; evite caminhos de credenciais, diretório pessoal, soquete do Docker e
  sistema.
- Use Gateways, usuários do sistema operacional ou hosts separados para limites de confiança
  substancialmente diferentes.

Se os usuários remotos não forem totalmente confiáveis, o isolamento deverá vir de
implantações separadas, não apenas de prompts ou rótulos de sessão.

## Validação após as alterações

Após cada alteração de exposição:

1. Execute novamente `openclaw security audit --deep`.
2. Confirme que uma conexão autorizada é estabelecida com sucesso.
3. Confirme que um remetente ou uma sessão de navegador não autorizada tem o acesso negado.
4. Confirme que os segredos são ocultados nos logs.
5. Confirme que o roteamento de mensagens diretas/grupos alcança somente o agente pretendido.
6. Confirme que ferramentas de alto impacto solicitam aprovação ou têm o acesso negado.
7. Documente os avisos residuais aceitos.

Não prossiga para a próxima alteração de exposição até compreender a alteração
atual.

## Plano de reversão

Se houver possibilidade de o Gateway estar excessivamente exposto:

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Em seguida:

1. Interrompa o encaminhamento público, o Tailscale Funnel ou as rotas do proxy reverso.
2. Troque os tokens/senhas do Gateway e as credenciais das integrações afetadas.
3. Remova `"*"` e remetentes inesperados das listas de permissões.
4. Analise os logs de auditoria recentes, o histórico de execuções, as chamadas de ferramentas e as alterações de configuração.
5. Execute novamente `openclaw security audit --deep`.
6. Reative o acesso usando o padrão mais restrito que atenda ao fluxo de trabalho.

## Lista de verificação para análise

- O Gateway permanece restrito ao local loopback, a menos que haja um motivo documentado.
- O acesso fora do local loopback tem autenticação, proteção por firewall e nenhuma rota pública direta.
- Implantações com proxy confiável têm IPs de proxy estritos e controles de cabeçalhos.
- As mensagens diretas usam pareamento ou listas de permissões, e não acesso aberto por padrão.
- Os grupos exigem menções ou listas de permissões explícitas.
- Os canais compartilhados não têm acesso a credenciais pessoais.
- As sessões não principais são executadas no modo sandbox.
- A execução no host e as ferramentas elevadas são negadas ou condicionadas à aprovação.
- Os logs ocultam segredos.
- As constatações críticas da auditoria foram resolvidas.
- As etapas de reversão foram testadas e documentadas.
