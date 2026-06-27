---
read_when:
    - Executando o OpenClaw por trás de um proxy com reconhecimento de identidade
    - Configurando Pomerium, Caddy ou nginx com OAuth na frente do OpenClaw
    - Corrigindo erros 1008 de não autorizado do WebSocket em configurações com proxy reverso
    - Decidindo onde configurar HSTS e outros cabeçalhos de proteção HTTP
sidebarTitle: Trusted proxy auth
summary: Delegue a autenticação do Gateway a um proxy reverso confiável (Pomerium, Caddy, nginx + OAuth)
title: Autenticação de proxy confiável
x-i18n:
    generated_at: "2026-06-27T17:35:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 498a8aca666f88201302af3895b11ba43ab9c0b1bff00a262145fc9e21e80fa7
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Recurso sensível à segurança.** Este modo delega a autenticação inteiramente ao seu proxy reverso. Uma configuração incorreta pode expor seu Gateway a acesso não autorizado. Leia esta página com atenção antes de habilitar.
</Warning>

## Quando usar

Use o modo de autenticação `trusted-proxy` quando:

- Você executa o OpenClaw atrás de um **proxy com reconhecimento de identidade** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Seu proxy gerencia toda a autenticação e passa a identidade do usuário por cabeçalhos.
- Você está em um ambiente Kubernetes ou de contêiner em que o proxy é o único caminho para o Gateway.
- Você está encontrando erros WebSocket `1008 unauthorized` porque os navegadores não conseguem passar tokens em payloads WS.

## Quando NÃO usar

- Se seu proxy não autentica usuários (apenas um terminador TLS ou balanceador de carga).
- Se houver qualquer caminho para o Gateway que contorne o proxy (brechas no firewall, acesso pela rede interna).
- Se você não tiver certeza de que seu proxy remove/substitui corretamente os cabeçalhos encaminhados.
- Se você só precisa de acesso pessoal para um único usuário (considere Tailscale Serve + loopback para uma configuração mais simples).

## Como funciona

<Steps>
  <Step title="O proxy autentica o usuário">
    Seu proxy reverso autentica usuários (OAuth, OIDC, SAML etc.).
  </Step>
  <Step title="O proxy adiciona um cabeçalho de identidade">
    O proxy adiciona um cabeçalho com a identidade do usuário autenticado (por exemplo, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="O Gateway verifica a origem confiável">
    O OpenClaw verifica se a solicitação veio de um **IP de proxy confiável** (configurado em `gateway.trustedProxies`).
  </Step>
  <Step title="O Gateway extrai a identidade">
    O OpenClaw extrai a identidade do usuário do cabeçalho configurado.
  </Step>
  <Step title="Autorizar">
    Se tudo estiver correto, a solicitação é autorizada.
  </Step>
</Steps>

## Comportamento de pareamento da Control UI

Quando `gateway.auth.mode = "trusted-proxy"` está ativo e a solicitação passa nas verificações de trusted-proxy, as sessões WebSocket da Control UI podem se conectar sem identidade de pareamento de dispositivo.

Implicações de escopo:

- Sessões WebSocket da Control UI sem dispositivo se conectam, mas não recebem escopos de operador por padrão. O OpenClaw limpa a lista de escopos solicitados para `[]` para que uma sessão que não esteja vinculada a um dispositivo/token pareado aprovado não possa declarar permissões por conta própria.
- Se métodos falharem com `missing scope` após uma conexão WebSocket bem-sucedida, use HTTPS para que o navegador possa gerar identidade de dispositivo e concluir o pareamento. Consulte [HTTP inseguro da Control UI](/pt-BR/web/control-ui#insecure-http).
- Apenas para emergência: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` preserva os escopos solicitados mesmo sem identidade de dispositivo. Isso é um rebaixamento grave de segurança; reverta rapidamente. Consulte [HTTP inseguro da Control UI](/pt-BR/web/control-ui#insecure-http).

Limitação de escopo por proxy reverso:

- Se seu proxy enviar `x-openclaw-scopes` na solicitação de upgrade WebSocket da Control UI, o OpenClaw limita os escopos da sessão à interseção entre os escopos solicitados e os escopos declarados. Esse cabeçalho não concede escopos; ele apenas restringe o que a sessão pode manter.

Implicações:

- O pareamento deixa de ser o gate principal para acesso à Control UI neste modo.
- A política de autenticação do seu proxy reverso e `allowUsers` passam a ser o controle de acesso efetivo.
- Mantenha a entrada do gateway bloqueada apenas para IPs de proxy confiáveis (`gateway.trustedProxies` + firewall).

Clientes WebSocket personalizados não são sessões da Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` não concede escopos a clientes arbitrários `client.mode: "backend"` ou com formato de CLI. Automações personalizadas devem usar identidade/pareamento de dispositivo, o caminho auxiliar backend direto-local reservado `client.id: "gateway-client"` ou o [Plugin HTTP RPC de administração](/pt-BR/plugins/admin-http-rpc) quando uma superfície HTTP de solicitação/resposta for mais adequada.

## Configuração

```json5
{
  gateway: {
    // Trusted-proxy auth expects requests from a non-loopback trusted proxy source by default
    bind: "lan",

    // CRITICAL: Only add your proxy's IP(s) here
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header containing authenticated user identity (required)
        userHeader: "x-forwarded-user",

        // Optional: headers that MUST be present (proxy verification)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Optional: restrict to specific users (empty = allow all)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Optional: allow a same-host loopback proxy after explicit opt-in
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Regras importantes de runtime**

- A autenticação trusted-proxy rejeita por padrão solicitações de origem loopback (`127.0.0.1`, `::1`, CIDRs de loopback).
- Proxies reversos loopback no mesmo host **não** satisfazem a autenticação trusted-proxy, a menos que você defina explicitamente `gateway.auth.trustedProxy.allowLoopback = true` e inclua o endereço de loopback em `gateway.trustedProxies`.
- `allowLoopback` confia em processos locais no host do Gateway no mesmo grau que o proxy reverso. Habilite apenas quando o Gateway ainda estiver protegido por firewall contra acesso remoto direto e o proxy local remover ou substituir cabeçalhos de identidade fornecidos pelo cliente.
- Clientes internos do Gateway que não passam pelo proxy reverso devem usar `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, não cabeçalhos de identidade trusted-proxy.
- Implantações não loopback da Control UI ainda precisam de `gateway.controlUi.allowedOrigins` explícito.
- **Evidências de cabeçalho encaminhado substituem a localidade loopback para fallback local direto.** Se uma solicitação chega por loopback, mas carrega evidências de cabeçalho `Forwarded`, qualquer `X-Forwarded-*` ou `X-Real-IP`, essas evidências desqualificam o fallback local direto por senha e o gate por identidade de dispositivo. Com `allowLoopback: true`, a autenticação trusted-proxy ainda pode aceitar a solicitação como uma solicitação de proxy no mesmo host, enquanto `requiredHeaders` e `allowUsers` continuam se aplicando.

</Warning>

### Referência de configuração

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array de endereços IP de proxy nos quais confiar. Solicitações de outros IPs são rejeitadas.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Deve ser `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nome do cabeçalho que contém a identidade do usuário autenticado.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Cabeçalhos adicionais que devem estar presentes para que a solicitação seja confiável.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Lista de permissão de identidades de usuário. Vazio significa permitir todos os usuários autenticados.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean">
  Suporte opt-in para proxies reversos loopback no mesmo host. O padrão é `false`.
</ParamField>

<Warning>
Habilite `allowLoopback` apenas quando o proxy reverso local for o limite de confiança pretendido. Qualquer processo local que possa se conectar ao Gateway pode tentar enviar cabeçalhos de identidade de proxy, portanto mantenha o acesso direto ao Gateway privado ao host e exija cabeçalhos controlados pelo proxy, como `x-forwarded-proto`, ou um cabeçalho de declaração assinado quando seu proxy oferecer suporte a isso.
</Warning>

## Terminação TLS e HSTS

Use um único ponto de terminação TLS e aplique HSTS nele.

<Tabs>
  <Tab title="Terminação TLS no proxy (recomendado)">
    Quando seu proxy reverso gerencia HTTPS para `https://control.example.com`, defina `Strict-Transport-Security` no proxy para esse domínio.

    - Boa opção para implantações expostas à internet.
    - Mantém a política de certificado + proteção HTTP em um só lugar.
    - O OpenClaw pode permanecer em HTTP loopback atrás do proxy.

    Valor de cabeçalho de exemplo:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminação TLS no Gateway">
    Se o próprio OpenClaw servir HTTPS diretamente (sem proxy com terminação TLS), defina:

    ```json5
    {
      gateway: {
        tls: { enabled: true },
        http: {
          securityHeaders: {
            strictTransportSecurity: "max-age=31536000; includeSubDomains",
          },
        },
      },
    }
    ```

    `strictTransportSecurity` aceita um valor de cabeçalho em string ou `false` para desabilitar explicitamente.

  </Tab>
</Tabs>

### Orientação de implantação

- Comece primeiro com uma idade máxima curta (por exemplo, `max-age=300`) enquanto valida o tráfego.
- Aumente para valores de longa duração (por exemplo, `max-age=31536000`) somente depois que a confiança estiver alta.
- Adicione `includeSubDomains` apenas se todos os subdomínios estiverem prontos para HTTPS.
- Use preload apenas se você atender intencionalmente aos requisitos de preload para todo o seu conjunto de domínios.
- O desenvolvimento local apenas em loopback não se beneficia de HSTS.

## Exemplos de configuração de proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    O Pomerium passa identidade em `x-pomerium-claim-email` (ou outros cabeçalhos de declaração) e um JWT em `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Pomerium's IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-pomerium-claim-email",
            requiredHeaders: ["x-pomerium-jwt-assertion"],
          },
        },
      },
    }
    ```

    Trecho de configuração do Pomerium:

    ```yaml
    routes:
      - from: https://openclaw.example.com
        to: http://openclaw-gateway:18789
        policy:
          - allow:
              or:
                - email:
                    is: nick@example.com
        pass_identity_headers: true
    ```

  </Accordion>
  <Accordion title="Caddy com OAuth">
    O Caddy com o Plugin `caddy-security` pode autenticar usuários e passar cabeçalhos de identidade.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // Caddy/sidecar proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Trecho de Caddyfile:

    ```
    openclaw.example.com {
        authenticate with oauth2_provider
        authorize with policy1

        reverse_proxy openclaw:18789 {
            header_up X-Forwarded-User {http.auth.user.email}
        }
    }
    ```

  </Accordion>
  <Accordion title="nginx + oauth2-proxy">
    O oauth2-proxy autentica usuários e passa identidade em `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // nginx/oauth2-proxy IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-auth-request-email",
          },
        },
      },
    }
    ```

    Trecho de configuração do nginx:

    ```nginx
    location / {
        auth_request /oauth2/auth;
        auth_request_set $user $upstream_http_x_auth_request_email;

        proxy_pass http://openclaw:18789;
        proxy_set_header X-Auth-Request-Email $user;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    ```

  </Accordion>
  <Accordion title="Traefik com forward auth">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // Traefik container IP
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## Configuração mista de token

O OpenClaw rejeita configurações ambíguas em que tanto um `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) quanto o modo `trusted-proxy` estão ativos ao mesmo tempo. Configurações mistas de token podem fazer com que solicitações loopback sejam autenticadas silenciosamente pelo caminho de autenticação errado.

Se você vir um erro `mixed_trusted_proxy_token` na inicialização:

- Remova o token compartilhado ao usar o modo trusted-proxy, ou
- Altere `gateway.auth.mode` para `"token"` se você pretende usar autenticação baseada em token.

A identidade por cabeçalhos de proxy confiável em loopback ainda falha fechada: chamadores no mesmo host não são autenticados silenciosamente como usuários do proxy. Chamadores internos do OpenClaw que contornam o proxy podem se autenticar com `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` em vez disso. O fallback por token continua intencionalmente sem suporte no modo de proxy confiável.

## Cabeçalho de escopos do operador

A autenticação por proxy confiável é um modo HTTP **portador de identidade**, portanto os chamadores podem declarar opcionalmente escopos de operador com `x-openclaw-scopes` em requisições da API HTTP.

Observação: os escopos de WebSocket são determinados pelo handshake do protocolo Gateway e pela vinculação de identidade do dispositivo. Em requisições de upgrade WebSocket da Control UI, `x-openclaw-scopes` é apenas um limite para os escopos negociados da sessão, não uma concessão. Para o comportamento de escopos WebSocket com proxy confiável, consulte [comportamento de pareamento da Control UI](#control-ui-pairing-behavior).

Exemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando o cabeçalho está presente, o OpenClaw respeita o conjunto de escopos declarado.
- Quando o cabeçalho está presente, mas vazio, a requisição declara **nenhum** escopo de operador.
- Quando o cabeçalho está ausente, APIs HTTP normais portadoras de identidade recorrem ao conjunto padrão de escopos padrão do operador.
- **Rotas HTTP de Plugin** com autenticação pelo Gateway são mais restritas por padrão: quando `x-openclaw-scopes` está ausente, seu escopo de runtime recai para `operator.write`.
- Requisições HTTP originadas no navegador ainda precisam passar por `gateway.controlUi.allowedOrigins` (ou pelo modo deliberado de fallback de cabeçalho Host), mesmo depois que a autenticação por proxy confiável é bem-sucedida.
- Para sessões WebSocket da Control UI, `x-openclaw-scopes` é um limite de escopo quando presente na requisição de upgrade. Um valor vazio resulta em nenhum escopo.

Regra prática: envie `x-openclaw-scopes` explicitamente quando quiser que uma requisição por proxy confiável seja mais restrita que os padrões, ou quando uma rota de Plugin com autenticação pelo Gateway precisar de algo mais forte que escopo de escrita.

## Checklist de segurança

Antes de habilitar a autenticação por proxy confiável, verifique:

- [ ] **Proxy é o único caminho**: A porta do Gateway está protegida por firewall contra tudo, exceto seu proxy.
- [ ] **trustedProxies é mínimo**: Apenas os IPs reais do seu proxy, não sub-redes inteiras.
- [ ] **Fonte de proxy por loopback é deliberada**: a autenticação por proxy confiável falha fechada para requisições com origem em loopback, a menos que `gateway.auth.trustedProxy.allowLoopback` esteja explicitamente habilitado para um proxy no mesmo host.
- [ ] **Proxy remove cabeçalhos**: Seu proxy sobrescreve (não acrescenta) cabeçalhos `x-forwarded-*` dos clientes.
- [ ] **Terminação TLS**: Seu proxy lida com TLS; usuários se conectam via HTTPS.
- [ ] **allowedOrigins é explícito**: Control UI sem loopback usa `gateway.controlUi.allowedOrigins` explícito.
- [ ] **allowUsers está definido** (recomendado): Restrinja a usuários conhecidos em vez de permitir qualquer pessoa autenticada.
- [ ] **Sem configuração mista de token**: Não defina `gateway.auth.token` e `gateway.auth.mode: "trusted-proxy"` ao mesmo tempo.
- [ ] **Fallback de senha local é privado**: Se você configurar `gateway.auth.password` para chamadores internos diretos, mantenha a porta do Gateway protegida por firewall para que clientes remotos fora do proxy não possam alcançá-la diretamente.

## Auditoria de segurança

`openclaw security audit` sinalizará autenticação por proxy confiável com um achado de severidade **crítica**. Isso é intencional: é um lembrete de que você está delegando a segurança à configuração do seu proxy.

A auditoria verifica:

- Lembrete/aviso crítico base `gateway.trusted_proxy_auth`
- Configuração `trustedProxies` ausente
- Configuração `userHeader` ausente
- `allowUsers` vazio (permite qualquer usuário autenticado)
- `allowLoopback` habilitado para origens de proxy no mesmo host
- Política de origem de navegador curinga ou ausente em superfícies expostas da Control UI

## Solução de problemas

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    A requisição não veio de um IP em `gateway.trustedProxies`. Verifique:

    - O IP do proxy está correto? (IPs de contêineres Docker podem mudar.)
    - Há um balanceador de carga na frente do seu proxy?
    - Use `docker inspect` ou `kubectl get pods -o wide` para encontrar os IPs reais.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    O OpenClaw rejeitou uma requisição de proxy confiável com origem em loopback.

    Verifique:

    - O proxy está se conectando a partir de `127.0.0.1` / `::1`?
    - Você está tentando usar autenticação por proxy confiável com um proxy reverso de loopback no mesmo host?

    Correção:

    - Prefira autenticação por token/senha para clientes internos no mesmo host que não passam pelo proxy, ou
    - Roteie por um endereço de proxy confiável que não seja loopback e mantenha esse IP em `gateway.trustedProxies`, ou
    - Para um proxy reverso deliberado no mesmo host, defina `gateway.auth.trustedProxy.allowLoopback = true`, mantenha o endereço de loopback em `gateway.trustedProxies` e garanta que o proxy remova ou sobrescreva cabeçalhos de identidade.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    O cabeçalho de usuário estava vazio ou ausente. Verifique:

    - Seu proxy está configurado para passar cabeçalhos de identidade?
    - O nome do cabeçalho está correto? (não diferencia maiúsculas de minúsculas, mas a grafia importa)
    - O usuário está realmente autenticado no proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Um cabeçalho obrigatório não estava presente. Verifique:

    - A configuração do seu proxy para esses cabeçalhos específicos.
    - Se os cabeçalhos estão sendo removidos em algum ponto da cadeia.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    O usuário está autenticado, mas não está em `allowUsers`. Adicione-o ou remova a lista de permissões.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    A autenticação por proxy confiável foi bem-sucedida, mas o cabeçalho `Origin` do navegador não passou nas verificações de origem da Control UI.

    Verifique:

    - `gateway.controlUi.allowedOrigins` inclui a origem exata do navegador.
    - Você não está dependendo de origens curinga, a menos que queira intencionalmente um comportamento de permitir tudo.
    - Se você usa intencionalmente o modo de fallback de cabeçalho Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está definido deliberadamente.

  </Accordion>
  <Accordion title="A conexão é bem-sucedida, mas os métodos relatam escopo ausente">
    O WebSocket conecta, mas `chat.history`, `sessions.list` ou
    `models.list` falha com `missing scope: operator.read`.

    Causas comuns:

    - Sessão da Control UI sem dispositivo: a autenticação por proxy confiável pode admitir a conexão WebSocket sem identidade de dispositivo, mas o OpenClaw limpa os escopos em sessões sem dispositivo por design.
    - Cliente de backend personalizado: `gateway.controlUi.dangerouslyDisableDeviceAuth` tem escopo da Control UI e não concede escopos a clientes WebSocket arbitrários em formato de backend ou CLI.
    - `x-openclaw-scopes` excessivamente restrito: se seu proxy injeta esse cabeçalho na requisição de upgrade WebSocket da Control UI, os escopos da sessão são limitados a esse conjunto. Um valor de cabeçalho vazio resulta em nenhum escopo.

    Correção:

    - Para a Control UI, use HTTPS para que o navegador possa gerar identidade de dispositivo e concluir o pareamento.
    - Para automação personalizada, use identidade de dispositivo/pareamento, o caminho auxiliar de backend reservado `gateway-client` direto-local ou [RPC HTTP de administração](/pt-BR/plugins/admin-http-rpc).
    - Use `gateway.controlUi.dangerouslyDisableDeviceAuth: true` apenas como um caminho temporário de emergência para a Control UI.

  </Accordion>
  <Accordion title="WebSocket ainda falhando">
    Garanta que seu proxy:

    - Suporte upgrades de WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Passe os cabeçalhos de identidade em requisições de upgrade WebSocket (não apenas HTTP).
    - Não tenha um caminho de autenticação separado para conexões WebSocket.

  </Accordion>
</AccordionGroup>

## Migração da autenticação por token

Se você está migrando da autenticação por token para proxy confiável:

<Steps>
  <Step title="Configure o proxy">
    Configure seu proxy para autenticar usuários e passar cabeçalhos.
  </Step>
  <Step title="Teste o proxy independentemente">
    Teste a configuração do proxy independentemente (curl com cabeçalhos).
  </Step>
  <Step title="Atualize a configuração do OpenClaw">
    Atualize a configuração do OpenClaw com autenticação por proxy confiável.
  </Step>
  <Step title="Reinicie o Gateway">
    Reinicie o Gateway.
  </Step>
  <Step title="Teste WebSocket">
    Teste conexões WebSocket a partir da Control UI.
  </Step>
  <Step title="Auditoria">
    Execute `openclaw security audit` e revise os achados.
  </Step>
</Steps>

## Relacionados

- [Configuração](/pt-BR/gateway/configuration) — referência de configuração
- [Acesso remoto](/pt-BR/gateway/remote) — outros padrões de acesso remoto
- [Segurança](/pt-BR/gateway/security) — guia de segurança completo
- [Tailscale](/pt-BR/gateway/tailscale) — alternativa mais simples para acesso somente por tailnet
