---
read_when:
    - Exposição do Gateway via LAN, tailnet, Tailscale Serve, Funnel ou proxy reverso
    - Revisando uma implantação antes de permitir usuários reais de mensagens
    - Revertendo uma configuração arriscada de acesso remoto ou de mensagens diretas
sidebarTitle: Exposure runbook
summary: Checklist de pré-implantação e reversão antes de expor um Gateway do OpenClaw além da interface de loopback
title: Runbook de exposição do Gateway
x-i18n:
    generated_at: "2026-07-12T15:16:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Exponha o Gateway somente depois de conseguir explicar quem pode acessá-lo, como essas pessoas são
autenticadas, quais agentes elas podem acionar e quais ferramentas esses agentes podem
usar. Em caso de dúvida, retorne ao acesso somente por loopback e execute novamente a auditoria.
</Warning>

Este runbook transforma as orientações mais amplas de [Segurança](/pt-BR/gateway/security) em uma
lista de verificação operacional para acesso remoto e exposição de mensagens.

## Escolha o padrão de exposição

Prefira o padrão mais restrito que atenda ao fluxo de trabalho.

| Padrão                     | Recomendado quando                                      | Controles obrigatórios                                                                                                                                             |
| -------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loopback + túnel SSH       | Uso pessoal, acesso administrativo, depuração           | Mantenha `gateway.bind: "loopback"` e crie um túnel para `127.0.0.1:18789`                                                                                          |
| Loopback + Tailscale Serve | Acesso da tailnet pessoal à interface de controle/WebSocket | Mantenha o Gateway somente em loopback; os cabeçalhos de identidade do Tailscale autenticam apenas a superfície WebSocket da interface de controle, não outros caminhos de autenticação |
| Bind na tailnet/LAN        | Rede privada dedicada com dispositivos conhecidos      | Autenticação do Gateway, lista de permissões do firewall, sem encaminhamento de porta pública                                                                      |
| Proxy reverso confiável    | SSO/OIDC da organização à frente do Gateway             | Autenticação `trusted-proxy`, `trustedProxies` estrito, regras para sobrescrever/remover cabeçalhos, usuários permitidos explicitamente                             |
| Internet pública           | Implantações raras e de alto risco                      | Proxy com reconhecimento de identidade, TLS, limites de taxa, listas de permissões estritas, sessões não principais em sandbox                                    |

Evite o encaminhamento direto de portas públicas para o Gateway. Se o acesso público for
necessário, coloque um proxy com reconhecimento de identidade à frente dele e faça do proxy o
único caminho de rede até o Gateway.

## Inventário prévio

Registre estas informações antes de alterar políticas de bind, proxy, Tailscale ou canal:

- Host do Gateway, usuário do SO e diretório de estado (padrão: `~/.openclaw`).
- URL e modo de bind do Gateway (`gateway.bind`; porta padrão `18789`).
- Modo de autenticação, origem do token/senha ou origem da identidade do proxy confiável.
- Todos os canais habilitados e se aceitam mensagens diretas, grupos ou webhooks.
- Agentes acessíveis por remetentes não locais.
- Perfil de ferramentas, modo de sandbox e política de ferramentas elevadas para cada agente acessível.
- Credenciais externas disponíveis para esses agentes.
- Local do backup de `~/.openclaw/openclaw.json` e das credenciais.

Se mais de uma pessoa puder enviar mensagens ao bot, trate isso como autoridade delegada
compartilhada sobre ferramentas, não como isolamento do host por usuário.

## Verificações de referência

Execute antes de liberar o acesso:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Resolva primeiro as constatações críticas. Aceite avisos somente quando forem intencionais e
documentados para a implantação. Consulte [Verificações da auditoria de segurança](/pt-BR/gateway/security/audit-checks)
para saber o que cada `checkId` significa e qual é sua chave de correção.

Para validação remota pela CLI, forneça as credenciais explicitamente:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Não suponha que as credenciais da configuração local se apliquem a uma URL remota explícita.

## Referência mínima de segurança

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

Amplie um controle por vez: adicione uma lista de permissões para um canal específico antes de habilitar
ferramentas com capacidade de escrita ou habilite um proxy reverso antes de aceitar tráfego remoto da
interface de controle.

`tools.exec.security: "deny"` bloqueia todas as chamadas de execução, inclusive diagnósticos
inofensivos. Se diagnósticos ou comandos de baixo risco forem necessários, flexibilize isso somente
depois de escolher os remetentes, agentes, comandos e o modo de aprovação específicos que
correspondam ao seu modelo de ameaças.

## Exposição de mensagens diretas e grupos

Os canais de mensagens são superfícies de entrada não confiáveis. Antes de permitir mensagens diretas ou
grupos:

- Prefira `dmPolicy: "pairing"` ou uma lista `allowFrom` estrita em vez de `dmPolicy: "open"`.
- Não combine listas de permissões `"*"` com acesso amplo a ferramentas.
- Exija menções em grupos, a menos que a sala seja rigidamente controlada.
- Defina `session.dmScope: "per-channel-peer"` (ou `"per-account-channel-peer"` para
  canais com várias contas) quando várias pessoas puderem enviar mensagens diretas ao bot, para que as sessões de mensagens diretas
  não compartilhem contexto.
- Encaminhe canais compartilhados para agentes com o mínimo de ferramentas e sem credenciais
  pessoais.

O pareamento aprova o remetente para acionar o bot. Ele não transforma esse remetente em um
limite de segurança de host separado.

## Verificações do proxy reverso

Para proxies com reconhecimento de identidade:

- O proxy deve autenticar os usuários antes de encaminhar solicitações ao Gateway.
- O firewall ou a política de rede deve bloquear o acesso direto à porta do Gateway.
- `gateway.trustedProxies` deve listar somente os IPs de origem do proxy.
- O proxy deve remover ou sobrescrever cabeçalhos de identidade e encaminhamento
  fornecidos pelo cliente.
- Defina `gateway.auth.trustedProxy.allowUsers` quando o proxy atender a mais de
  um público.
- Use `gateway.auth.trustedProxy.allowLoopback` somente para um proxy no mesmo host,
  quando os processos locais forem confiáveis e o proxy controlar os cabeçalhos de identidade.

Execute `openclaw security audit --deep` após alterações no proxy. As constatações sobre proxy confiável
são altamente relevantes porque o proxy se torna o limite de
autenticação.

## Revisão de ferramentas e sandbox

Antes de expor um agente a remetentes remotos:

- Confirme quais sessões são executadas no host e quais são executadas no sandbox.
- Negue ou exija aprovação para execução no host.
- Mantenha as ferramentas elevadas desabilitadas, a menos que um remetente específico e confiável precise delas.
- Evite ferramentas de navegador, canvas, Node, Cron, Gateway e criação de sessões em superfícies de mensagens
  abertas ou semiabertas.
- Mantenha os pontos de montagem restritos; evite caminhos de credenciais, do diretório inicial, do soquete do Docker e do sistema.
- Use Gateways, usuários do SO ou hosts separados para limites de confiança substancialmente
  diferentes.

Se os usuários remotos não forem totalmente confiáveis, o isolamento deve vir de implantações
separadas, não apenas de prompts ou rótulos de sessão.

## Validação após as alterações

Após cada alteração de exposição:

1. Execute novamente `openclaw security audit --deep`.
2. Confirme que uma conexão autorizada é estabelecida com sucesso.
3. Confirme que um remetente ou uma sessão de navegador não autorizada é bloqueada.
4. Confirme que os logs ocultam segredos.
5. Confirme que o roteamento de mensagens diretas/grupos alcança somente o agente pretendido.
6. Confirme que ferramentas de alto impacto solicitam aprovação ou são bloqueadas.
7. Documente os avisos residuais aceitos.

Não prossiga para a próxima alteração de exposição até que a atual seja
compreendida.

## Plano de reversão

Se o Gateway puder estar excessivamente exposto:

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
2. Troque os tokens/senhas do Gateway e as credenciais de integração afetadas.
3. Remova `"*"` e remetentes inesperados das listas de permissões.
4. Revise os logs de auditoria recentes, o histórico de execuções, as chamadas de ferramentas e as alterações de configuração.
5. Execute novamente `openclaw security audit --deep`.
6. Reative o acesso com o padrão mais restrito que atenda ao fluxo de trabalho.

## Lista de verificação da revisão

- O Gateway permanece somente em loopback, a menos que haja um motivo documentado.
- O acesso fora de loopback tem autenticação, proteção por firewall e nenhuma rota pública direta.
- Implantações com proxy confiável têm IPs de proxy estritos e controles de cabeçalhos.
- As mensagens diretas usam pareamento ou listas de permissões, e não acesso aberto por padrão.
- Os grupos exigem menções ou listas de permissões explícitas.
- Os canais compartilhados não têm acesso a credenciais pessoais.
- As sessões não principais são executadas no modo sandbox.
- A execução no host e as ferramentas elevadas são bloqueadas ou condicionadas à aprovação.
- Os logs ocultam segredos.
- As constatações críticas da auditoria foram resolvidas.
- As etapas de reversão foram testadas e documentadas.
