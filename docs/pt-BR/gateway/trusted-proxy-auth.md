---
read_when:
    - Executando o OpenClaw atrás de um proxy com reconhecimento de identidade
    - Configurando Pomerium, Caddy ou nginx com OAuth na frente do OpenClaw
    - Corrigindo erros WebSocket 1008 não autorizado em configurações com proxy reverso
    - Decidindo onde definir HSTS e outros headers de hardening HTTP
summary: Delegar a autenticação do Gateway a um proxy reverso confiável (Pomerium, Caddy, nginx + OAuth)
title: Autenticação de proxy confiável
x-i18n:
    generated_at: "2026-04-23T14:03:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 649529e9a350d7df3a9ecbbae8871d61e1dff2069dfabf2f86a77a0d96c52778
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

# Autenticação de proxy confiável

> ⚠️ **Recurso sensível à segurança.** Esse modo delega a autenticação inteiramente ao seu proxy reverso. Uma configuração incorreta pode expor seu Gateway a acesso não autorizado. Leia esta página com atenção antes de habilitar.

## Quando usar

Use o modo de autenticação `trusted-proxy` quando:

- Você executa o OpenClaw atrás de um **proxy com reconhecimento de identidade** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Seu proxy cuida de toda a autenticação e repassa a identidade do usuário por headers
- Você está em um ambiente Kubernetes ou de contêiner em que o proxy é o único caminho até o Gateway
- Você está encontrando erros WebSocket `1008 unauthorized` porque navegadores não conseguem passar tokens no payload WS

## Quando NÃO usar

- Se seu proxy não autentica usuários (apenas termina TLS ou atua como load balancer)
- Se existir qualquer caminho até o Gateway que contorne o proxy (falhas de firewall, acesso pela rede interna)
- Se você não tiver certeza de que seu proxy remove/sobrescreve corretamente headers encaminhados
- Se você só precisar de acesso pessoal de um único usuário (considere Tailscale Serve + loopback para uma configuração mais simples)

## Como funciona

1. Seu proxy reverso autentica usuários (OAuth, OIDC, SAML etc.)
2. O proxy adiciona um header com a identidade do usuário autenticado (por exemplo, `x-forwarded-user: nick@example.com`)
3. O OpenClaw verifica se a solicitação veio de um **IP de proxy confiável** (configurado em `gateway.trustedProxies`)
4. O OpenClaw extrai a identidade do usuário a partir do header configurado
5. Se tudo estiver correto, a solicitação é autorizada

## Comportamento de emparelhamento da UI de controle

Quando `gateway.auth.mode = "trusted-proxy"` está ativo e a solicitação passa nas
verificações de proxy confiável, sessões WebSocket da UI de controle podem se conectar sem
identidade de emparelhamento do dispositivo.

Implicações:

- O emparelhamento deixa de ser o gate principal para acesso à UI de controle nesse modo.
- Sua política de autenticação do proxy reverso e `allowUsers` tornam-se o controle de acesso efetivo.
- Mantenha o ingresso do Gateway bloqueado apenas aos IPs de proxy confiável (`gateway.trustedProxies` + firewall).

## Configuração

```json5
{
  gateway: {
    // A autenticação trusted-proxy espera solicitações vindas de uma origem de proxy confiável não loopback
    bind: "lan",

    // CRÍTICO: adicione aqui apenas o(s) IP(s) do seu proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Header que contém a identidade do usuário autenticado (obrigatório)
        userHeader: "x-forwarded-user",

        // Opcional: headers que DEVEM estar presentes (verificação do proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcional: restringe a usuários específicos (vazio = permite todos)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Regra importante de runtime:

- A autenticação trusted-proxy rejeita solicitações vindas de origem loopback (`127.0.0.1`, `::1`, CIDRs loopback).
- Proxies reversos loopback no mesmo host **não** satisfazem a autenticação trusted-proxy.
- Para configurações com proxy loopback no mesmo host, use autenticação por token/senha, ou roteie por um endereço de proxy confiável não loopback que o OpenClaw consiga verificar.
- Implantações não loopback da UI de controle ainda precisam de `gateway.controlUi.allowedOrigins` explícito.
- **Evidência de forwarded-header substitui a localidade loopback.** Se uma solicitação chega em loopback, mas carrega headers `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` apontando para uma origem não local, essa evidência desqualifica a alegação de localidade loopback. A solicitação é tratada como remota para emparelhamento, autenticação trusted-proxy e gating de identidade de dispositivo da UI de controle. Isso impede que um proxy loopback no mesmo host “lave” identidade de forwarded-header para autenticação trusted-proxy.

### Referência de configuração

| Campo                                      | Obrigatório | Descrição                                                                  |
| ------------------------------------------ | ----------- | -------------------------------------------------------------------------- |
| `gateway.trustedProxies`                   | Sim         | Array de endereços IP do proxy em que confiar. Solicitações de outros IPs são rejeitadas. |
| `gateway.auth.mode`                        | Sim         | Deve ser `"trusted-proxy"`                                                 |
| `gateway.auth.trustedProxy.userHeader`     | Sim         | Nome do header que contém a identidade do usuário autenticado              |
| `gateway.auth.trustedProxy.requiredHeaders`| Não         | Headers adicionais que devem estar presentes para que a solicitação seja confiável |
| `gateway.auth.trustedProxy.allowUsers`     | Não         | Lista de permissões de identidades de usuário. Vazio significa permitir todos os usuários autenticados. |

## Terminação TLS e HSTS

Use um único ponto de terminação TLS e aplique HSTS nele.

### Padrão recomendado: terminação TLS no proxy

Quando seu proxy reverso lida com HTTPS para `https://control.example.com`, defina
`Strict-Transport-Security` no proxy para esse domínio.

- Boa opção para implantações expostas à internet.
- Mantém certificado + política de hardening HTTP em um único lugar.
- O OpenClaw pode permanecer em HTTP loopback atrás do proxy.

Exemplo de valor de header:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminação TLS no Gateway

Se o próprio OpenClaw servir HTTPS diretamente (sem proxy que termine TLS), defina:

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

`strictTransportSecurity` aceita um valor de header string ou `false` para desabilitar explicitamente.

### Orientação de rollout

- Comece primeiro com um max age curto (por exemplo `max-age=300`) enquanto valida o tráfego.
- Aumente para valores de longa duração (por exemplo `max-age=31536000`) somente quando a confiança estiver alta.
- Adicione `includeSubDomains` apenas se todos os subdomínios estiverem prontos para HTTPS.
- Use preload apenas se você atender intencionalmente aos requisitos de preload para todo o seu conjunto de domínios.
- Desenvolvimento local somente loopback não se beneficia de HSTS.

## Exemplos de configuração de proxy

### Pomerium

O Pomerium repassa identidade em `x-pomerium-claim-email` (ou outros claim headers) e um JWT em `x-pomerium-jwt-assertion`.

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

### Caddy com OAuth

O Caddy com o plugin `caddy-security` pode autenticar usuários e repassar headers de identidade.

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

### nginx + oauth2-proxy

O oauth2-proxy autentica usuários e repassa a identidade em `x-auth-request-email`.

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

### Traefik com Forward Auth

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

## Configuração mista de token

O OpenClaw rejeita configurações ambíguas em que tanto `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) quanto o modo `trusted-proxy` estão ativos ao mesmo tempo. Configurações mistas de token podem fazer com que solicitações loopback sejam autenticadas silenciosamente pelo caminho de autenticação errado.

Se você vir um erro `mixed_trusted_proxy_token` na inicialização:

- Remova o token compartilhado ao usar o modo trusted-proxy, ou
- Altere `gateway.auth.mode` para `"token"` se sua intenção for usar autenticação baseada em token.

A autenticação trusted-proxy em loopback também falha de forma fechada: chamadores no mesmo host devem fornecer os headers de identidade configurados por meio de um proxy confiável, em vez de serem autenticados silenciosamente.

## Header de escopos do operador

A autenticação trusted-proxy é um modo HTTP **portador de identidade**, então os chamadores podem
declarar opcionalmente escopos de operador com `x-openclaw-scopes`.

Exemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando o header está presente, o OpenClaw respeita o conjunto de escopos declarado.
- Quando o header está presente, mas vazio, a solicitação declara **nenhum** escopo de operador.
- Quando o header está ausente, APIs HTTP normais portadoras de identidade recorrem ao conjunto padrão de escopos do operador.
- Rotas HTTP de plugin com autenticação Gateway são mais restritas por padrão: quando `x-openclaw-scopes` está ausente, o escopo de runtime delas recorre a `operator.write`.
- Solicitações HTTP originadas no navegador ainda precisam passar por `gateway.controlUi.allowedOrigins` (ou pelo modo deliberado de fallback de header Host) mesmo depois que a autenticação trusted-proxy tiver êxito.

Regra prática:

- Envie `x-openclaw-scopes` explicitamente quando quiser que uma solicitação trusted-proxy
  seja mais restrita do que os padrões, ou quando uma rota de plugin com autenticação Gateway precisar
  de algo mais forte do que o escopo de escrita.

## Checklist de segurança

Antes de habilitar a autenticação trusted-proxy, verifique:

- [ ] **O proxy é o único caminho**: a porta do Gateway está bloqueada por firewall para tudo, exceto o proxy
- [ ] **trustedProxies é mínimo**: apenas os IPs reais do seu proxy, não sub-redes inteiras
- [ ] **Sem origem de proxy loopback**: a autenticação trusted-proxy falha de forma fechada para solicitações de origem loopback
- [ ] **O proxy remove headers**: seu proxy sobrescreve (não acrescenta) headers `x-forwarded-*` vindos dos clientes
- [ ] **Terminação TLS**: seu proxy lida com TLS; os usuários se conectam por HTTPS
- [ ] **allowedOrigins é explícito**: UI de controle não loopback usa `gateway.controlUi.allowedOrigins` explícito
- [ ] **allowUsers está definido** (recomendado): restrinja a usuários conhecidos em vez de permitir qualquer pessoa autenticada
- [ ] **Sem configuração mista de token**: não defina ao mesmo tempo `gateway.auth.token` e `gateway.auth.mode: "trusted-proxy"`

## Auditoria de segurança

`openclaw security audit` sinalizará a autenticação trusted-proxy com um achado de severidade **critical**. Isso é intencional — é um lembrete de que você está delegando a segurança à configuração do seu proxy.

A auditoria verifica:

- Aviso/lembrete base `gateway.trusted_proxy_auth` warning/critical
- Configuração `trustedProxies` ausente
- Configuração `userHeader` ausente
- `allowUsers` vazio (permite qualquer usuário autenticado)
- Política de origem do navegador curinga ou ausente em superfícies expostas da UI de controle

## Solução de problemas

### "trusted_proxy_untrusted_source"

A solicitação não veio de um IP em `gateway.trustedProxies`. Verifique:

- O IP do proxy está correto? (IPs de contêiner Docker podem mudar)
- Há um load balancer na frente do seu proxy?
- Use `docker inspect` ou `kubectl get pods -o wide` para encontrar os IPs reais

### "trusted_proxy_loopback_source"

O OpenClaw rejeitou uma solicitação trusted-proxy de origem loopback.

Verifique:

- O proxy está se conectando a partir de `127.0.0.1` / `::1`?
- Você está tentando usar autenticação trusted-proxy com um proxy reverso loopback no mesmo host?

Correção:

- Use autenticação por token/senha para configurações com proxy loopback no mesmo host, ou
- Faça o roteamento por um endereço de proxy confiável não loopback e mantenha esse IP em `gateway.trustedProxies`.

### "trusted_proxy_user_missing"

O header do usuário estava vazio ou ausente. Verifique:

- Seu proxy está configurado para repassar headers de identidade?
- O nome do header está correto? (não diferencia maiúsculas de minúsculas, mas a grafia importa)
- O usuário está realmente autenticado no proxy?

### "trusted*proxy_missing_header*\*"

Um header obrigatório não estava presente. Verifique:

- A configuração do seu proxy para esses headers específicos
- Se os headers estão sendo removidos em algum ponto da cadeia

### "trusted_proxy_user_not_allowed"

O usuário está autenticado, mas não está em `allowUsers`. Adicione-o ou remova a lista de permissões.

### "trusted_proxy_origin_not_allowed"

A autenticação trusted-proxy teve êxito, mas o header `Origin` do navegador não passou nas verificações de origem da UI de controle.

Verifique:

- `gateway.controlUi.allowedOrigins` inclui a origem exata do navegador
- Você não está dependendo de origens curinga, a menos que intencionalmente queira comportamento de permitir tudo
- Se você usa intencionalmente o modo de fallback de header Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está definido deliberadamente

### WebSocket ainda falhando

Confirme que o seu proxy:

- Oferece suporte a upgrades de WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Repassa os headers de identidade em solicitações de upgrade de WebSocket (não apenas HTTP)
- Não tem um caminho de autenticação separado para conexões WebSocket

## Migração de autenticação por token

Se você está migrando da autenticação por token para trusted-proxy:

1. Configure seu proxy para autenticar usuários e repassar headers
2. Teste a configuração do proxy independentemente (curl com headers)
3. Atualize a configuração do OpenClaw com autenticação trusted-proxy
4. Reinicie o Gateway
5. Teste conexões WebSocket a partir da UI de controle
6. Execute `openclaw security audit` e revise os achados

## Relacionado

- [Segurança](/pt-BR/gateway/security) — guia completo de segurança
- [Configuração](/pt-BR/gateway/configuration) — referência de configuração
- [Acesso remoto](/pt-BR/gateway/remote) — outros padrões de acesso remoto
- [Tailscale](/pt-BR/gateway/tailscale) — alternativa mais simples para acesso apenas pela tailnet
