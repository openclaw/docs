---
read_when:
    - Expondo o Gateway pela LAN, tailnet, Tailscale Serve, Funnel ou um proxy reverso
    - Revisando uma implantação antes de permitir usuários reais de mensagens
    - Revertendo uma configuração arriscada de acesso remoto ou DM
sidebarTitle: Exposure runbook
summary: Lista de verificação de pré-voo e reversão antes de expor um Gateway do OpenClaw além do loopback
title: Runbook de exposição do Gateway
x-i18n:
    generated_at: "2026-06-27T17:33:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c5e94cc03b9d79a03eb16aa04bad0fd311b72f27f14182c036832382dbce3d0f
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
Exponha o Gateway somente depois que você puder explicar quem pode acessá-lo, como essas pessoas são
autenticadas, quais agentes elas podem acionar e quais ferramentas esses agentes podem
usar. Em caso de dúvida, volte ao acesso somente por loopback e execute novamente a auditoria.
</Warning>

Este runbook transforma a orientação mais ampla de [Segurança](/pt-BR/gateway/security) em uma
lista de verificação operacional para acesso remoto e exposição de mensagens.

## Escolha o padrão de exposição

Prefira o padrão mais restrito que satisfaça o fluxo de trabalho.

| Padrão                    | Recomendado quando                                | Controles obrigatórios                                                                                   |
| -------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Loopback + túnel SSH      | Uso pessoal, acesso administrativo, depuração           | Mantenha `gateway.bind: "loopback"` e encaminhe por túnel `127.0.0.1:18789`                                        |
| Loopback + Tailscale Serve | Acesso por tailnet pessoal à Interface de Controle/WebSocket | Mantenha o Gateway somente em loopback; dependa dos cabeçalhos de identidade do Tailscale apenas para superfícies compatíveis          |
| Vínculo tailnet/LAN           | Rede privada dedicada com dispositivos conhecidos    | Autenticação do Gateway, lista de permissões no firewall, sem encaminhamento de porta pública                                            |
| Proxy reverso confiável      | SSO/OIDC da organização na frente do Gateway       | Autenticação `trusted-proxy`, `trustedProxies` estritos, regras para sobrescrever/remover cabeçalhos, usuários permitidos explícitos |
| Internet pública            | Implantações raras e de alto risco                     | Proxy com identidade, TLS, limites de taxa, listas de permissões estritas, sessões não principais em sandbox              |

Evite encaminhamento direto de porta pública para o Gateway. Se você precisar de acesso público,
coloque um proxy com identidade na frente dele e torne o proxy o único caminho de rede
para o Gateway.

## Inventário prévio

Registre estes itens antes de alterar políticas de vínculo, proxy, Tailscale ou canais:

- Host do Gateway, usuário do sistema operacional e diretório de estado.
- URL do Gateway e modo de vínculo.
- Modo de autenticação, origem de token/senha ou origem de identidade do proxy confiável.
- Todos os canais habilitados e se eles aceitam DMs, grupos ou Webhooks.
- Agentes acessíveis por remetentes não locais.
- Perfil de ferramentas, modo de sandbox e política de ferramentas elevadas para cada agente acessível.
- Credenciais externas disponíveis para esses agentes.
- Local do backup de `~/.openclaw/openclaw.json` e credenciais.

Se mais de uma pessoa puder enviar mensagens ao bot, trate isso como autoridade compartilhada
e delegada sobre ferramentas, não como isolamento de host por usuário.

## Verificações de base

Execute estes comandos antes de abrir o acesso:

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Resolva primeiro as descobertas críticas. Avisos podem ser aceitáveis somente quando forem
intencionais e documentados para a implantação.

Para validação remota da CLI, passe as credenciais explicitamente:

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Não presuma que as credenciais da configuração local se aplicam a uma URL remota explícita.

## Linha de base mínima segura

Use este formato como ponto de partida para implantações expostas:

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

Depois amplie um controle por vez. Por exemplo, adicione uma lista de permissões específica
para canais antes de habilitar ferramentas com capacidade de escrita, ou habilite um proxy
reverso antes de aceitar tráfego remoto da Interface de Controle.

A linha de base estrita `exec.security: "deny"` bloqueia todas as chamadas exec, incluindo
diagnósticos benignos. Se diagnósticos ou comandos de baixo risco forem necessários, relaxe isso
somente depois de escolher os remetentes, agentes, comandos e modo de aprovação específicos
que correspondem ao seu modelo de ameaça.

## Exposição de DMs e grupos

Canais de mensagens são superfícies de entrada não confiáveis. Antes de permitir DMs ou grupos:

- Prefira `dmPolicy: "pairing"` ou listas `allowFrom` estritas.
- Evite `dmPolicy: "open"` a menos que todo remetente seja confiável.
- Não combine listas de permissões `"*"` com acesso amplo a ferramentas.
- Exija menções em grupos, a menos que a sala seja rigidamente controlada.
- Use `session.dmScope: "per-channel-peer"` quando várias pessoas puderem enviar DM ao bot.
- Direcione canais compartilhados para agentes com ferramentas mínimas e sem credenciais pessoais.

O pareamento aprova o remetente para acionar o bot. Ele não transforma esse remetente em
um limite de segurança de host separado.

## Verificações de proxy reverso

Para proxies com identidade:

- O proxy deve autenticar usuários antes de encaminhar para o Gateway.
- O acesso direto à porta do Gateway deve ser bloqueado por firewall ou política de rede.
- `gateway.trustedProxies` deve conter somente os IPs de origem do proxy.
- O proxy deve remover ou sobrescrever cabeçalhos de identidade e encaminhamento fornecidos pelo cliente.
- `gateway.auth.trustedProxy.allowUsers` deve listar os usuários esperados quando o proxy atende mais de um público.
- O modo de proxy por loopback no mesmo host deve usar `allowLoopback` somente quando os processos locais forem confiáveis e o proxy for dono dos cabeçalhos de identidade.

Execute `openclaw security audit --deep` após alterações no proxy. As descobertas de proxy confiável
são intencionalmente de alto sinal porque o proxy se torna o limite de autenticação.

## Revisão de ferramentas e sandbox

Antes de expor um agente a remetentes remotos:

- Confirme quais sessões são executadas no host versus no sandbox.
- Negue ou exija aprovação para exec no host.
- Mantenha ferramentas elevadas desabilitadas, a menos que um remetente específico e confiável precise delas.
- Evite ferramentas de navegador, canvas, node, cron, gateway e criação de sessão para superfícies de mensagens abertas ou semiabertas.
- Mantenha montagens de vínculo restritas e evite credenciais, home, socket do Docker e caminhos do sistema.
- Use gateways, usuários do sistema operacional ou hosts separados para limites de confiança materialmente diferentes.

Se usuários remotos não forem totalmente confiáveis, o isolamento deve vir de implantações
separadas, não apenas de prompts ou rótulos de sessão.

## Validação pós-alteração

Após cada alteração de exposição:

1. Execute novamente `openclaw security audit --deep`.
2. Teste uma conexão autorizada bem-sucedida.
3. Teste que um remetente ou sessão de navegador não autorizados são negados.
4. Confirme que os logs redigem segredos.
5. Confirme que o roteamento de DM/grupo alcança somente o agente pretendido.
6. Confirme que ferramentas de alto impacto pedem aprovação ou são negadas.
7. Documente os avisos residuais aceitos.

Não prossiga para a próxima alteração de exposição até que a atual seja compreendida.

## Plano de reversão

Se o Gateway puder estar exposto demais:

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

Então:

1. Interrompa encaminhamentos públicos, Tailscale Funnel ou rotas de proxy reverso.
2. Rotacione tokens/senhas do Gateway e credenciais de integração afetadas.
3. Remova `"*"` e remetentes inesperados das listas de permissões.
4. Revise logs de auditoria recentes, histórico de execuções, chamadas de ferramentas e alterações de configuração.
5. Execute novamente `openclaw security audit --deep`.
6. Reabilite o acesso com o padrão mais restrito que satisfaça o fluxo de trabalho.

## Lista de verificação de revisão

- O Gateway permanece somente em loopback, a menos que haja um motivo documentado.
- O acesso não loopback tem autenticação, firewall e nenhuma rota direta pública.
- Implantações com proxy confiável têm IPs de proxy e controles de cabeçalho estritos.
- DMs usam pareamento ou listas de permissões, não acesso aberto por padrão.
- Grupos exigem menções ou listas de permissões explícitas.
- Canais compartilhados não alcançam credenciais pessoais.
- Sessões não principais são executadas em modo sandbox.
- Exec no host e ferramentas elevadas são negados ou protegidos por aprovação.
- Logs redigem segredos.
- Descobertas críticas de auditoria são resolvidas.
- Etapas de reversão são testadas e documentadas.
