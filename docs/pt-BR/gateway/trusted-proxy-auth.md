---
read_when:
    - Executando o OpenClaw atrás de um proxy com reconhecimento de identidade
    - Configurando Pomerium, Caddy ou nginx com OAuth na frente do OpenClaw
    - Corrigindo erros WebSocket 1008 de não autorizado em configurações com proxy reverso
    - Decidindo onde definir HSTS e outros cabeçalhos de endurecimento HTTP
sidebarTitle: Trusted proxy auth
summary: Delegar a autenticação do gateway a um proxy reverso confiável (Pomerium, Caddy, nginx + OAuth)
title: Autenticação trusted proxy
x-i18n:
    generated_at: "2026-04-26T11:31:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 64e0f4dee942aedec548135f0408e7773e7b498f8262af13a4d0eff262cae646
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

<Warning>
**Recurso sensível à segurança.** Este modo delega completamente a autenticação ao seu proxy reverso. Uma configuração incorreta pode expor seu Gateway a acesso não autorizado. Leia esta página com atenção antes de ativar.
</Warning>

## Quando usar

Use o modo de autenticação `trusted-proxy` quando:

- Você executa o OpenClaw atrás de um **proxy com reconhecimento de identidade** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth).
- Seu proxy trata toda a autenticação e repassa a identidade do usuário via cabeçalhos.
- Você está em um ambiente Kubernetes ou de contêiner em que o proxy é o único caminho até o Gateway.
- Você está encontrando erros WebSocket `1008 unauthorized` porque navegadores não conseguem passar tokens em cargas WS.

## Quando NÃO usar

- Se seu proxy não autentica usuários (é apenas um terminador TLS ou balanceador de carga).
- Se houver qualquer caminho para o Gateway que contorne o proxy (brechas no firewall, acesso por rede interna).
- Se você não tiver certeza se seu proxy remove/substitui corretamente cabeçalhos encaminhados.
- Se você só precisar de acesso pessoal de um único usuário (considere Tailscale Serve + loopback para uma configuração mais simples).

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

Quando `gateway.auth.mode = "trusted-proxy"` está ativo e a solicitação passa nas verificações de trusted-proxy, sessões WebSocket da Control UI podem se conectar sem identidade de pareamento de dispositivo.

Implicações:

- O pareamento deixa de ser o controle principal para acesso à Control UI neste modo.
- Sua política de autenticação do proxy reverso e `allowUsers` se tornam o controle de acesso efetivo.
- Mantenha o ingresso do gateway restrito apenas a IPs de proxy confiáveis (`gateway.trustedProxies` + firewall).

## Configuração

```json5
{
  gateway: {
    // A autenticação trusted-proxy espera solicitações de uma origem de proxy confiável fora de loopback
    bind: "lan",

    // CRÍTICO: adicione aqui apenas o(s) IP(s) do seu proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Cabeçalho contendo a identidade do usuário autenticado (obrigatório)
        userHeader: "x-forwarded-user",

        // Opcional: cabeçalhos que DEVEM estar presentes (verificação do proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcional: restringir a usuários específicos (vazio = permite todos)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

<Warning>
**Regras importantes de runtime**

- A autenticação trusted-proxy rejeita solicitações de origem loopback (`127.0.0.1`, `::1`, CIDRs de loopback).
- Proxies reversos no mesmo host e em loopback **não** satisfazem a autenticação trusted-proxy.
- Para configurações com proxy em loopback no mesmo host, use autenticação por token/senha, ou roteie por um endereço de proxy confiável fora de loopback que o OpenClaw possa verificar.
- Implantações da Control UI fora de loopback ainda exigem `gateway.controlUi.allowedOrigins` explícito.
- **Evidência de cabeçalho encaminhado substitui localidade de loopback.** Se uma solicitação chegar em loopback, mas carregar cabeçalhos `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` apontando para uma origem não local, essa evidência desqualifica a alegação de localidade em loopback. A solicitação é tratada como remota para pareamento, autenticação trusted-proxy e bloqueio de identidade de dispositivo da Control UI. Isso impede que um proxy em loopback no mesmo host “lave” identidade de cabeçalho encaminhado para dentro da autenticação trusted-proxy.
</Warning>

### Referência de configuração

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Array de endereços IP de proxy confiáveis. Solicitações de outros IPs são rejeitadas.
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
  Allowlist de identidades de usuário. Vazio significa permitir todos os usuários autenticados.
</ParamField>

## Terminação TLS e HSTS

Use um único ponto de terminação TLS e aplique HSTS nele.

<Tabs>
  <Tab title="Terminação TLS no proxy (recomendado)">
    Quando seu proxy reverso trata HTTPS para `https://control.example.com`, defina `Strict-Transport-Security` no proxy para esse domínio.

    - Boa opção para implantações voltadas para a internet.
    - Mantém certificado + política de endurecimento HTTP em um só lugar.
    - O OpenClaw pode permanecer em HTTP loopback atrás do proxy.

    Exemplo de valor de cabeçalho:

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

    `strictTransportSecurity` aceita um valor de cabeçalho em string, ou `false` para desativar explicitamente.

  </Tab>
</Tabs>

### Orientação de rollout

- Comece primeiro com um max age curto (por exemplo `max-age=300`) enquanto valida o tráfego.
- Aumente para valores de longa duração (por exemplo `max-age=31536000`) apenas depois de ter alta confiança.
- Adicione `includeSubDomains` apenas se todos os subdomínios estiverem prontos para HTTPS.
- Use preload apenas se você atender intencionalmente aos requisitos de preload para todo o seu conjunto de domínios.
- Desenvolvimento local somente em loopback não se beneficia de HSTS.

## Exemplos de configuração de proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    O Pomerium passa identidade em `x-pomerium-claim-email` (ou outros cabeçalhos de claim) e um JWT em `x-pomerium-jwt-assertion`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP do Pomerium
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
    O Caddy com o plugin `caddy-security` pode autenticar usuários e passar cabeçalhos de identidade.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP do proxy Caddy/sidecar
        auth: {
          mode: "trusted-proxy",
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```

    Trecho do Caddyfile:

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
    O oauth2-proxy autentica usuários e passa a identidade em `x-auth-request-email`.

    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["10.0.0.1"], // IP do nginx/oauth2-proxy
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
        trustedProxies: ["172.17.0.1"], // IP do contêiner Traefik
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

O OpenClaw rejeita configurações ambíguas em que tanto `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) quanto o modo `trusted-proxy` estão ativos ao mesmo tempo. Configurações mistas de token podem fazer com que solicitações em loopback se autentiquem silenciosamente no caminho de autenticação errado.

Se você vir um erro `mixed_trusted_proxy_token` na inicialização:

- Remova o token compartilhado ao usar o modo trusted-proxy, ou
- Altere `gateway.auth.mode` para `"token"` se sua intenção for usar autenticação baseada em token.

A autenticação trusted-proxy em loopback também falha de forma fechada: chamadores no mesmo host devem fornecer os cabeçalhos de identidade configurados por meio de um proxy confiável, em vez de serem autenticados silenciosamente.

## Cabeçalho de escopos de operador

A autenticação trusted-proxy é um modo HTTP **portador de identidade**, então chamadores podem declarar opcionalmente escopos de operador com `x-openclaw-scopes`.

Exemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando o cabeçalho está presente, o OpenClaw respeita o conjunto de escopos declarado.
- Quando o cabeçalho está presente, mas vazio, a solicitação declara **nenhum** escopo de operador.
- Quando o cabeçalho está ausente, APIs HTTP normais portadoras de identidade usam fallback para o conjunto padrão de escopos de operador.
- **Rotas HTTP de plugin** com autenticação do Gateway são mais restritas por padrão: quando `x-openclaw-scopes` está ausente, o escopo de runtime delas usa fallback para `operator.write`.
- Solicitações HTTP originadas do navegador ainda precisam passar em `gateway.controlUi.allowedOrigins` (ou em um modo deliberado de fallback de cabeçalho Host), mesmo após a autenticação trusted-proxy ser bem-sucedida.

Regra prática: envie `x-openclaw-scopes` explicitamente quando você quiser que uma solicitação trusted-proxy seja mais restrita do que os padrões, ou quando uma rota de plugin com autenticação do gateway precisar de algo mais forte do que escopo de escrita.

## Checklist de segurança

Antes de ativar a autenticação trusted-proxy, verifique:

- [ ] **O proxy é o único caminho**: a porta do Gateway está protegida por firewall contra tudo, exceto seu proxy.
- [ ] **trustedProxies é mínimo**: apenas os IPs reais do seu proxy, não sub-redes inteiras.
- [ ] **Sem origem de proxy em loopback**: a autenticação trusted-proxy falha de forma fechada para solicitações com origem em loopback.
- [ ] **O proxy remove cabeçalhos**: seu proxy substitui (não anexa) cabeçalhos `x-forwarded-*` vindos dos clientes.
- [ ] **Terminação TLS**: seu proxy trata TLS; os usuários se conectam via HTTPS.
- [ ] **allowedOrigins é explícito**: Control UI fora de loopback usa `gateway.controlUi.allowedOrigins` explícito.
- [ ] **allowUsers está definido** (recomendado): restrinja a usuários conhecidos em vez de permitir qualquer usuário autenticado.
- [ ] **Sem configuração mista de token**: não defina ambos `gateway.auth.token` e `gateway.auth.mode: "trusted-proxy"`.

## Auditoria de segurança

`openclaw security audit` marcará a autenticação trusted-proxy com um achado de severidade **crítica**. Isso é intencional — é um lembrete de que você está delegando a segurança à configuração do seu proxy.

A auditoria verifica:

- Aviso/lembrete base `gateway.trusted_proxy_auth` com severidade warning/critical
- Configuração `trustedProxies` ausente
- Configuração `userHeader` ausente
- `allowUsers` vazio (permite qualquer usuário autenticado)
- Política de origem do navegador ausente ou coringa em superfícies expostas da Control UI

## Solução de problemas

<AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    A solicitação não veio de um IP em `gateway.trustedProxies`. Verifique:

    - O IP do proxy está correto? (IPs de contêiner Docker podem mudar.)
    - Há um balanceador de carga na frente do seu proxy?
    - Use `docker inspect` ou `kubectl get pods -o wide` para encontrar os IPs reais.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    O OpenClaw rejeitou uma solicitação trusted-proxy com origem em loopback.

    Verifique:

    - O proxy está se conectando a partir de `127.0.0.1` / `::1`?
    - Você está tentando usar autenticação trusted-proxy com um proxy reverso em loopback no mesmo host?

    Correção:

    - Use autenticação por token/senha para configurações com proxy em loopback no mesmo host, ou
    - Roteie por um endereço de proxy confiável fora de loopback e mantenha esse IP em `gateway.trustedProxies`.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    O cabeçalho do usuário estava vazio ou ausente. Verifique:

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
    O usuário está autenticado, mas não está em `allowUsers`. Adicione-o ou remova a allowlist.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    A autenticação trusted-proxy foi bem-sucedida, mas o cabeçalho `Origin` do navegador não passou nas verificações de origem da Control UI.

    Verifique:

    - `gateway.controlUi.allowedOrigins` inclui a origem exata do navegador.
    - Você não está dependendo de origens coringa, a menos que queira intencionalmente um comportamento de permitir tudo.
    - Se você usa intencionalmente o modo de fallback do cabeçalho Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está definido deliberadamente.

  </Accordion>
  <Accordion title="WebSocket ainda falhando">
    Certifique-se de que seu proxy:

    - Oferece suporte a upgrades de WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Passa os cabeçalhos de identidade em solicitações de upgrade de WebSocket (não apenas HTTP).
    - Não tem um caminho de autenticação separado para conexões WebSocket.

  </Accordion>
</AccordionGroup>

## Migração da autenticação por token

Se você estiver migrando de autenticação por token para trusted-proxy:

<Steps>
  <Step title="Configure o proxy">
    Configure seu proxy para autenticar usuários e passar cabeçalhos.
  </Step>
  <Step title="Teste o proxy de forma independente">
    Teste a configuração do proxy de forma independente (curl com cabeçalhos).
  </Step>
  <Step title="Atualize a configuração do OpenClaw">
    Atualize a configuração do OpenClaw com autenticação trusted-proxy.
  </Step>
  <Step title="Reinicie o Gateway">
    Reinicie o Gateway.
  </Step>
  <Step title="Teste o WebSocket">
    Teste conexões WebSocket a partir da Control UI.
  </Step>
  <Step title="Auditoria">
    Execute `openclaw security audit` e revise os achados.
  </Step>
</Steps>

## Relacionados

- [Configuração](/pt-BR/gateway/configuration) — referência de configuração
- [Acesso remoto](/pt-BR/gateway/remote) — outros padrões de acesso remoto
- [Segurança](/pt-BR/gateway/security) — guia completo de segurança
- [Tailscale](/pt-BR/gateway/tailscale) — alternativa mais simples para acesso apenas por tailnet
