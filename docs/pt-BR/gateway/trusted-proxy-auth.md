---
read_when:
    - Executando o OpenClaw atrás de um proxy com reconhecimento de identidade
    - Configurando Pomerium, Caddy ou nginx com OAuth na frente do OpenClaw
    - Corrigindo erros 1008 unauthorized do WebSocket em configurações com proxy reverso
    - Decidindo onde definir HSTS e outros cabeçalhos de endurecimento HTTP
summary: Delegar a autenticação do gateway a um proxy reverso confiável (Pomerium, Caddy, nginx + OAuth)
title: Autenticação de trusted proxy
x-i18n:
    generated_at: "2026-04-24T05:54:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: af406f218fb91c5ae2fed04921670bfc4cd3d06f51b08eec91cddde4521bf771
    source_path: gateway/trusted-proxy-auth.md
    workflow: 15
---

> ⚠️ **Recurso sensível à segurança.** Este modo delega a autenticação inteiramente ao seu proxy reverso. Uma configuração incorreta pode expor seu Gateway a acesso não autorizado. Leia esta página com atenção antes de habilitar.

## Quando usar

Use o modo de autenticação `trusted-proxy` quando:

- Você executa o OpenClaw atrás de um **proxy com reconhecimento de identidade** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + forward auth)
- Seu proxy cuida de toda a autenticação e passa a identidade do usuário por cabeçalhos
- Você está em um ambiente Kubernetes ou de contêiner em que o proxy é o único caminho até o Gateway
- Você está enfrentando erros WebSocket `1008 unauthorized` porque navegadores não conseguem passar tokens em payloads de WS

## Quando NÃO usar

- Se seu proxy não autentica usuários (apenas termina TLS ou atua como load balancer)
- Se existir qualquer caminho até o Gateway que contorne o proxy (brechas de firewall, acesso por rede interna)
- Se você não tiver certeza de que seu proxy remove/sobrescreve corretamente cabeçalhos encaminhados
- Se você precisa apenas de acesso pessoal de usuário único (considere Tailscale Serve + loopback para uma configuração mais simples)

## Como funciona

1. Seu proxy reverso autentica usuários (OAuth, OIDC, SAML etc.)
2. O proxy adiciona um cabeçalho com a identidade autenticada do usuário (por exemplo, `x-forwarded-user: nick@example.com`)
3. O OpenClaw verifica se a solicitação veio de um **IP de proxy confiável** (configurado em `gateway.trustedProxies`)
4. O OpenClaw extrai a identidade do usuário do cabeçalho configurado
5. Se tudo estiver correto, a solicitação é autorizada

## Comportamento de pareamento da Control UI

Quando `gateway.auth.mode = "trusted-proxy"` está ativo e a solicitação passa
nas verificações de trusted-proxy, sessões WebSocket da Control UI podem se conectar sem
identidade de pareamento de dispositivo.

Implicações:

- O pareamento deixa de ser o gate principal para acesso à Control UI nesse modo.
- Sua política de autenticação do proxy reverso e `allowUsers` tornam-se o controle efetivo de acesso.
- Mantenha o ingresso do gateway restrito apenas a IPs de proxy confiáveis (`gateway.trustedProxies` + firewall).

## Configuração

```json5
{
  gateway: {
    // A autenticação trusted-proxy espera solicitações de uma origem de proxy confiável não-loopback
    bind: "lan",

    // CRÍTICO: adicione aqui apenas os IPs do seu proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Cabeçalho contendo a identidade autenticada do usuário (obrigatório)
        userHeader: "x-forwarded-user",

        // Opcional: cabeçalhos que DEVEM estar presentes (verificação do proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcional: restringir a usuários específicos (vazio = permitir todos)
        allowUsers: ["nick@example.com", "admin@company.org"],
      },
    },
  },
}
```

Regra importante de runtime:

- A autenticação trusted-proxy rejeita solicitações de origem loopback (`127.0.0.1`, `::1`, CIDRs loopback).
- Proxies reversos loopback no mesmo host **não** satisfazem a autenticação trusted-proxy.
- Para configurações com proxy loopback no mesmo host, use autenticação por token/senha, ou roteie por um endereço de trusted-proxy não-loopback que o OpenClaw possa verificar.
- Implantações da Control UI fora de loopback ainda precisam de `gateway.controlUi.allowedOrigins` explícito.
- **Evidência de cabeçalho encaminhado substitui a localidade de loopback.** Se uma solicitação chega em loopback, mas carrega cabeçalhos `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` apontando para uma origem não local, essa evidência desqualifica a alegação de localidade loopback. A solicitação é tratada como remota para fins de pareamento, autenticação trusted-proxy e gating de identidade de dispositivo da Control UI. Isso impede que um proxy loopback no mesmo host “lave” a identidade de cabeçalho encaminhado para a autenticação trusted-proxy.

### Referência de configuração

| Campo                                       | Obrigatório | Descrição                                                                  |
| ------------------------------------------- | ----------- | -------------------------------------------------------------------------- |
| `gateway.trustedProxies`                    | Sim         | Array de endereços IP de proxy confiáveis. Solicitações de outros IPs são rejeitadas. |
| `gateway.auth.mode`                         | Sim         | Deve ser `"trusted-proxy"`                                                 |
| `gateway.auth.trustedProxy.userHeader`      | Sim         | Nome do cabeçalho contendo a identidade autenticada do usuário             |
| `gateway.auth.trustedProxy.requiredHeaders` | Não         | Cabeçalhos adicionais que devem estar presentes para que a solicitação seja confiável |
| `gateway.auth.trustedProxy.allowUsers`      | Não         | Lista de permissões de identidades de usuário. Vazio significa permitir todos os usuários autenticados. |

## Terminação TLS e HSTS

Use um único ponto de terminação TLS e aplique HSTS nele.

### Padrão recomendado: terminação TLS no proxy

Quando seu proxy reverso cuida do HTTPS para `https://control.example.com`, defina
`Strict-Transport-Security` no proxy para esse domínio.

- Boa opção para implantações voltadas para a internet.
- Mantém certificado + política de endurecimento HTTP em um único lugar.
- O OpenClaw pode permanecer em HTTP loopback atrás do proxy.

Exemplo de valor do cabeçalho:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Terminação TLS no Gateway

Se o próprio OpenClaw serve HTTPS diretamente (sem proxy que termine TLS), defina:

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

### Orientação de rollout

- Comece primeiro com um `max-age` curto (por exemplo `max-age=300`) enquanto valida o tráfego.
- Aumente para valores de longa duração (por exemplo `max-age=31536000`) apenas depois de ter alta confiança.
- Adicione `includeSubDomains` apenas se todos os subdomínios estiverem prontos para HTTPS.
- Use preload apenas se você atender intencionalmente aos requisitos de preload para todo o seu conjunto de domínios.
- Desenvolvimento local apenas com loopback não se beneficia de HSTS.

## Exemplos de configuração de proxy

### Pomerium

O Pomerium passa a identidade em `x-pomerium-claim-email` (ou outros cabeçalhos de claim) e um JWT em `x-pomerium-jwt-assertion`.

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

Trecho de configuração nginx:

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

O OpenClaw rejeita configurações ambíguas em que tanto `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`) quanto o modo `trusted-proxy` estão ativos ao mesmo tempo. Configurações mistas com token podem fazer com que solicitações loopback sejam autenticadas silenciosamente pelo caminho de autenticação errado.

Se você vir um erro `mixed_trusted_proxy_token` na inicialização:

- Remova o token compartilhado ao usar o modo trusted-proxy, ou
- Mude `gateway.auth.mode` para `"token"` se sua intenção for usar autenticação baseada em token.

A autenticação trusted-proxy em loopback também falha em modo fechado: chamadores no mesmo host devem fornecer os cabeçalhos de identidade configurados por meio de um proxy confiável em vez de serem autenticados silenciosamente.

## Cabeçalho de escopos do operador

A autenticação trusted-proxy é um modo HTTP **com identidade**, então chamadores podem
opcionalmente declarar escopos de operador com `x-openclaw-scopes`.

Exemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando o cabeçalho está presente, o OpenClaw respeita o conjunto de escopos declarado.
- Quando o cabeçalho está presente, mas vazio, a solicitação declara **nenhum** escopo de operador.
- Quando o cabeçalho está ausente, APIs HTTP normais com identidade usam como fallback o conjunto padrão de escopos de operador.
- **Rotas HTTP de plugin** com autenticação de gateway são mais restritas por padrão: quando `x-openclaw-scopes` está ausente, o escopo de runtime delas usa `operator.write` como fallback.
- Solicitações HTTP originadas do browser ainda precisam passar por `gateway.controlUi.allowedOrigins` (ou pelo modo deliberado de fallback de cabeçalho Host), mesmo depois de a autenticação trusted-proxy ser bem-sucedida.

Regra prática:

- Envie `x-openclaw-scopes` explicitamente quando quiser que uma solicitação trusted-proxy
  seja mais restrita do que os padrões, ou quando uma rota de plugin com autenticação de gateway
  precisar de algo mais forte do que escopo de escrita.

## Checklist de segurança

Antes de habilitar a autenticação trusted-proxy, verifique:

- [ ] **O proxy é o único caminho**: a porta do Gateway está protegida por firewall para tudo, exceto seu proxy
- [ ] **trustedProxies é mínimo**: apenas os IPs reais do seu proxy, não sub-redes inteiras
- [ ] **Sem origem de proxy loopback**: a autenticação trusted-proxy falha em modo fechado para solicitações de origem loopback
- [ ] **O proxy remove cabeçalhos**: seu proxy sobrescreve (não anexa) cabeçalhos `x-forwarded-*` vindos de clientes
- [ ] **Terminação TLS**: seu proxy cuida do TLS; usuários se conectam via HTTPS
- [ ] **allowedOrigins é explícito**: Control UI fora de loopback usa `gateway.controlUi.allowedOrigins` explícito
- [ ] **allowUsers está definido** (recomendado): restrinja a usuários conhecidos em vez de permitir qualquer usuário autenticado
- [ ] **Sem configuração mista de token**: não defina ambos `gateway.auth.token` e `gateway.auth.mode: "trusted-proxy"`

## Auditoria de segurança

`openclaw security audit` marcará a autenticação trusted-proxy com um achado de severidade **crítica**. Isso é intencional — é um lembrete de que você está delegando a segurança à configuração do seu proxy.

A auditoria verifica:

- Aviso/lembrete crítico base `gateway.trusted_proxy_auth`
- Configuração ausente de `trustedProxies`
- Configuração ausente de `userHeader`
- `allowUsers` vazio (permite qualquer usuário autenticado)
- Política de origem do browser curinga ou ausente em superfícies expostas da Control UI

## Solução de problemas

### "trusted_proxy_untrusted_source"

A solicitação não veio de um IP em `gateway.trustedProxies`. Verifique:

- O IP do proxy está correto? (IPs de contêiner Docker podem mudar)
- Existe um load balancer na frente do seu proxy?
- Use `docker inspect` ou `kubectl get pods -o wide` para encontrar os IPs reais

### "trusted_proxy_loopback_source"

O OpenClaw rejeitou uma solicitação trusted-proxy de origem loopback.

Verifique:

- O proxy está se conectando a partir de `127.0.0.1` / `::1`?
- Você está tentando usar autenticação trusted-proxy com um proxy reverso loopback no mesmo host?

Correção:

- Use autenticação por token/senha para configurações com proxy loopback no mesmo host, ou
- Roteie por um endereço de trusted-proxy não-loopback e mantenha esse IP em `gateway.trustedProxies`.

### "trusted_proxy_user_missing"

O cabeçalho do usuário estava vazio ou ausente. Verifique:

- Seu proxy está configurado para passar cabeçalhos de identidade?
- O nome do cabeçalho está correto? (não diferencia maiúsculas de minúsculas, mas a grafia importa)
- O usuário está realmente autenticado no proxy?

### "trusted*proxy_missing_header*\*"

Um cabeçalho obrigatório não estava presente. Verifique:

- A configuração do seu proxy para esses cabeçalhos específicos
- Se os cabeçalhos estão sendo removidos em algum ponto da cadeia

### "trusted_proxy_user_not_allowed"

O usuário está autenticado, mas não está em `allowUsers`. Adicione-o ou remova a lista de permissões.

### "trusted_proxy_origin_not_allowed"

A autenticação trusted-proxy foi bem-sucedida, mas o cabeçalho `Origin` do browser não passou nas verificações de origem da Control UI.

Verifique:

- `gateway.controlUi.allowedOrigins` inclui a origem exata do browser
- Você não está contando com origens curinga, a menos que queira intencionalmente um comportamento allow-all
- Se você usa intencionalmente o modo de fallback por cabeçalho Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` está definido deliberadamente

### O WebSocket ainda está falhando

Certifique-se de que seu proxy:

- Oferece suporte a upgrades de WebSocket (`Upgrade: websocket`, `Connection: upgrade`)
- Passa os cabeçalhos de identidade em solicitações de upgrade de WebSocket (não apenas HTTP)
- Não tem um caminho de autenticação separado para conexões WebSocket

## Migração de autenticação por token

Se você estiver migrando de autenticação por token para trusted-proxy:

1. Configure seu proxy para autenticar usuários e passar cabeçalhos
2. Teste a configuração do proxy de forma independente (curl com cabeçalhos)
3. Atualize a configuração do OpenClaw com autenticação trusted-proxy
4. Reinicie o Gateway
5. Teste conexões WebSocket a partir da Control UI
6. Execute `openclaw security audit` e revise os achados

## Relacionado

- [Segurança](/pt-BR/gateway/security) — guia completo de segurança
- [Configuração](/pt-BR/gateway/configuration) — referência de configuração
- [Acesso remoto](/pt-BR/gateway/remote) — outros padrões de acesso remoto
- [Tailscale](/pt-BR/gateway/tailscale) — alternativa mais simples para acesso apenas via tailnet
