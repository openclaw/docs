---
read_when:
    - Executando o OpenClaw por trás de um proxy com reconhecimento de identidade
    - Configurando Pomerium, Caddy ou nginx com OAuth na frente do OpenClaw
    - Corrigindo erros de WebSocket 1008 não autorizado em configurações com proxy reverso
    - Decidindo onde configurar o HSTS e outros cabeçalhos de reforço de segurança HTTP
sidebarTitle: Trusted proxy auth
summary: Delegue a autenticação do Gateway a um proxy reverso confiável (Pomerium, Caddy, nginx + OAuth)
title: Autenticação de proxy confiável
x-i18n:
    generated_at: "2026-07-12T15:19:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 612070e4872af23c2ac41b529c8b2fa8513bf18fccc053783f55ad00b44e1a5f
    source_path: gateway/trusted-proxy-auth.md
    workflow: 16
---

<Warning>
**Recurso sensível à segurança.** Este modo delega a autenticação inteiramente ao seu proxy reverso. Uma configuração incorreta pode expor seu Gateway a acesso não autorizado. Leia esta página com atenção antes de habilitá-lo.
</Warning>

## Quando usar

- Você executa o OpenClaw atrás de um **proxy com reconhecimento de identidade** (Pomerium, Caddy + OAuth, nginx + oauth2-proxy, Traefik + autenticação encaminhada).
- Seu proxy processa toda a autenticação e transmite a identidade do usuário por meio de cabeçalhos.
- Você está em um ambiente Kubernetes ou de contêineres no qual o proxy é o único caminho até o Gateway.
- Você está recebendo erros WebSocket `1008 unauthorized` porque os navegadores não conseguem transmitir tokens nas cargas úteis de WS.

## Quando NÃO usar

- Seu proxy não autentica os usuários (é apenas um terminador TLS ou balanceador de carga).
- Existe algum caminho até o Gateway que contorna o proxy (brechas no firewall, acesso pela rede interna).
- Você não tem certeza se o proxy remove ou sobrescreve corretamente os cabeçalhos encaminhados.
- Você precisa apenas de acesso pessoal para um único usuário (considere usar Tailscale Serve + loopback).

## Como funciona

<Steps>
  <Step title="O proxy autentica o usuário">
    Seu proxy reverso autentica os usuários (OAuth, OIDC, SAML etc.).
  </Step>
  <Step title="O proxy adiciona um cabeçalho de identidade">
    O proxy adiciona um cabeçalho com a identidade do usuário autenticado (por exemplo, `x-forwarded-user: nick@example.com`).
  </Step>
  <Step title="O Gateway verifica a origem confiável">
    O OpenClaw verifica se a solicitação veio de um **IP de proxy confiável** (`gateway.trustedProxies`) e não do próprio endereço de loopback ou de interface local do Gateway.
  </Step>
  <Step title="O Gateway extrai a identidade">
    O OpenClaw lê os cabeçalhos obrigatórios e, em seguida, a identidade do usuário no cabeçalho configurado.
  </Step>
  <Step title="Autorizar">
    Se todas as verificações forem bem-sucedidas e o usuário passar por `allowUsers` (quando definido), a solicitação será autorizada.
  </Step>
</Steps>

## Configuração

```json5
{
  gateway: {
    // Por padrão, a autenticação por proxy confiável espera que o IP de origem do proxy não seja de loopback
    bind: "lan",

    // CRÍTICO: adicione aqui apenas os IPs do seu proxy
    trustedProxies: ["10.0.0.1", "172.17.0.1"],

    auth: {
      mode: "trusted-proxy",
      trustedProxy: {
        // Cabeçalho que contém a identidade do usuário autenticado (obrigatório)
        userHeader: "x-forwarded-user",

        // Opcional: cabeçalhos que DEVEM estar presentes (verificação do proxy)
        requiredHeaders: ["x-forwarded-proto", "x-forwarded-host"],

        // Opcional: restringir a usuários específicos (vazio = permitir todos)
        allowUsers: ["nick@example.com", "admin@company.org"],

        // Opcional: permitir um proxy de loopback no mesmo host após adesão explícita
        allowLoopback: false,
      },
    },
  },
}
```

<Warning>
**Regras de tempo de execução, na ordem de avaliação**

1. O IP de origem da solicitação deve corresponder a `gateway.trustedProxies` (com suporte a CIDR), caso contrário ela será rejeitada (`trusted_proxy_untrusted_source`).
2. As solicitações com origem em loopback (`127.0.0.1`, `::1`) são rejeitadas, a menos que `gateway.auth.trustedProxy.allowLoopback = true` e o endereço de loopback também esteja em `trustedProxies` (`trusted_proxy_loopback_source`). Essa verificação é executada antes das verificações de cabeçalhos; portanto, uma origem de loopback falha dessa forma mesmo que também estejam faltando cabeçalhos obrigatórios.
3. As origens que não são de loopback e correspondem a um dos endereços das próprias interfaces de rede locais do host do Gateway são rejeitadas como proteção contra falsificação (`trusted_proxy_local_interface_source`). Se a própria descoberta de interfaces falhar, a solicitação também será rejeitada (`trusted_proxy_local_interface_check_failed`).
4. `requiredHeaders` e `userHeader` devem estar presentes e não podem estar em branco.
5. Se `allowUsers` não estiver vazio, deverá incluir o usuário extraído.

**Evidências de cabeçalhos encaminhados substituem a localidade de loopback para o fallback local direto.** Se uma solicitação chegar por loopback, mas contiver um cabeçalho `Forwarded`, qualquer cabeçalho `X-Forwarded-*` ou `X-Real-IP`, essa evidência a desqualificará do fallback local direto por senha e da verificação de identidade do dispositivo, embora ela ainda falhe na autenticação por proxy confiável por ser de loopback.

`allowLoopback` confia nos processos locais do host do Gateway no mesmo grau que no proxy reverso. Habilite essa opção somente quando o Gateway ainda estiver protegido por firewall contra acesso remoto direto e o proxy local remover ou sobrescrever os cabeçalhos de identidade fornecidos pelo cliente.

Clientes internos do Gateway que não passem pelo proxy reverso devem usar `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`, não cabeçalhos de identidade de proxy confiável. Implantações da Control UI fora do loopback ainda precisam de `gateway.controlUi.allowedOrigins` explícito.
</Warning>

### Referência de configuração

<ParamField path="gateway.trustedProxies" type="string[]" required>
  Matriz de endereços IP de proxies (ou CIDRs) nos quais confiar. Solicitações provenientes de outros IPs são rejeitadas.
</ParamField>
<ParamField path="gateway.auth.mode" type="string" required>
  Deve ser `"trusted-proxy"`.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.userHeader" type="string" required>
  Nome do cabeçalho que contém a identidade do usuário autenticado.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.requiredHeaders" type="string[]">
  Cabeçalhos adicionais que devem estar presentes para que a solicitação seja considerada confiável.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowUsers" type="string[]">
  Lista de permissões de identidades de usuários. Vazia significa permitir todos os usuários autenticados.
</ParamField>
<ParamField path="gateway.auth.trustedProxy.allowLoopback" type="boolean" default="false">
  Suporte opcional a proxies reversos de loopback no mesmo host.
</ParamField>

<Warning>
Habilite `allowLoopback` somente quando o proxy reverso local for o limite de confiança pretendido. Qualquer processo local que consiga se conectar ao Gateway pode tentar enviar cabeçalhos de identidade de proxy; portanto, mantenha o acesso direto ao Gateway restrito ao host e exija cabeçalhos controlados pelo proxy, como `x-forwarded-proto`, ou um cabeçalho de declaração assinada quando seu proxy oferecer suporte a isso.
</Warning>

## Comportamento de pareamento da Control UI

Quando `gateway.auth.mode = "trusted-proxy"` está ativo e a solicitação passa pelas verificações de proxy confiável, as sessões WebSocket da Control UI podem se conectar sem identidade de pareamento do dispositivo.

Implicações de escopo:

- Sessões WebSocket da Control UI sem dispositivo se conectam, mas não recebem escopos de operador por padrão. O OpenClaw redefine a lista de escopos solicitados como `[]` para que uma sessão não vinculada a um dispositivo/token pareado e aprovado não possa declarar permissões para si mesma.
- Se os métodos falharem com `missing scope` após uma conexão WebSocket bem-sucedida, use HTTPS para que o navegador possa gerar a identidade do dispositivo e concluir o pareamento. Consulte [HTTP não seguro da Control UI](/pt-BR/web/control-ui#insecure-http).
- Somente em caso de emergência: `gateway.controlUi.dangerouslyDisableDeviceAuth=true` preserva os escopos solicitados mesmo sem identidade de dispositivo. Isso representa uma redução grave da segurança; reverta rapidamente. Consulte [HTTP não seguro da Control UI](/pt-BR/web/control-ui#insecure-http).

Limitação de escopos pelo proxy reverso: se o proxy enviar `x-openclaw-scopes` na solicitação de upgrade do WebSocket da Control UI, o OpenClaw limitará os escopos da sessão à interseção entre os escopos solicitados e os declarados. Esse cabeçalho não concede escopos; apenas restringe os que a sessão pode ter.

Implicações:

- O pareamento deixa de ser a barreira principal para o acesso à Control UI neste modo.
- A política de autenticação do seu proxy reverso e `allowUsers` tornam-se o controle de acesso efetivo.
- Mantenha a entrada do Gateway restrita apenas aos IPs de proxies confiáveis (`gateway.trustedProxies` + firewall).

Clientes WebSocket personalizados não são sessões da Control UI. `gateway.controlUi.dangerouslyDisableDeviceAuth` não concede escopos a clientes arbitrários com `client.mode: "backend"` ou formato de CLI. Automações personalizadas devem usar identidade/pareamento de dispositivo, o caminho auxiliar reservado de backend local direto `client.id: "gateway-client"` ou o [plugin de RPC HTTP administrativo](/pt-BR/plugins/admin-http-rpc) quando uma interface HTTP de solicitação/resposta for mais adequada.

## Cabeçalho de escopos do operador

A autenticação por proxy confiável é um modo HTTP **portador de identidade**; portanto, os chamadores podem, opcionalmente, declarar escopos do operador com `x-openclaw-scopes` nas solicitações à API HTTP.

Observação: os escopos do WebSocket são determinados pelo handshake do protocolo do Gateway e pela vinculação da identidade do dispositivo. Nas solicitações de upgrade do WebSocket da Control UI, `x-openclaw-scopes` é apenas um limite para os escopos negociados da sessão, não uma concessão. Consulte [Comportamento de pareamento da Control UI](#control-ui-pairing-behavior).

Exemplos:

- `x-openclaw-scopes: operator.read`
- `x-openclaw-scopes: operator.read,operator.write`
- `x-openclaw-scopes: operator.admin,operator.write`

Comportamento:

- Quando o cabeçalho está presente, o OpenClaw respeita o conjunto de escopos declarado.
- Quando o cabeçalho está presente, mas vazio, a solicitação declara **nenhum** escopo de operador.
- Quando o cabeçalho está ausente, as APIs HTTP normais portadoras de identidade usam como fallback o conjunto padrão de escopos do operador (`operator.admin`, `operator.read`, `operator.write`, `operator.approvals`, `operator.pairing`, `operator.talk.secrets`).
- As **rotas HTTP de plugins** com autenticação do Gateway são mais restritas por padrão: quando `x-openclaw-scopes` está ausente, o escopo de tempo de execução usa como fallback apenas `operator.write`.
- Solicitações HTTP originadas do navegador ainda precisam passar por `gateway.controlUi.allowedOrigins` (ou pelo modo de fallback deliberado do cabeçalho Host), mesmo após a autenticação por proxy confiável ser bem-sucedida.

Regra prática: envie `x-openclaw-scopes` explicitamente quando quiser que uma solicitação de proxy confiável seja mais restrita que os padrões ou quando uma rota de plugin com autenticação do Gateway precisar de algo mais forte que o escopo de gravação.

## Terminação TLS e HSTS

Use um único ponto de terminação TLS e aplique o HSTS nesse ponto.

<Tabs>
  <Tab title="Terminação TLS no proxy (recomendada)">
    Quando o proxy reverso processar HTTPS para `https://control.example.com`, defina `Strict-Transport-Security` no proxy para esse domínio.

    - Adequado para implantações voltadas para a Internet.
    - Mantém o certificado e a política de proteção do HTTP em um só lugar.
    - O OpenClaw pode permanecer em HTTP de loopback atrás do proxy.

    Exemplo de valor do cabeçalho:

    ```text
    Strict-Transport-Security: max-age=31536000; includeSubDomains
    ```

  </Tab>
  <Tab title="Terminação TLS no Gateway">
    Se o próprio OpenClaw fornecer HTTPS diretamente (sem um proxy que encerre o TLS), defina:

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

    `strictTransportSecurity` aceita uma string como valor de cabeçalho ou `false` para desabilitá-lo explicitamente.

  </Tab>
</Tabs>

### Orientações de implantação

- Comece primeiro com uma duração máxima curta (por exemplo, `max-age=300`) enquanto valida o tráfego.
- Aumente para valores de longa duração (por exemplo, `max-age=31536000`) somente após atingir um alto nível de confiança.
- Adicione `includeSubDomains` somente se todos os subdomínios estiverem preparados para HTTPS.
- Use a pré-carga somente se você atender intencionalmente aos requisitos de pré-carga para todo o conjunto de domínios.
- O desenvolvimento local restrito a loopback não se beneficia do HSTS.

## Exemplos de configuração de proxy

<AccordionGroup>
  <Accordion title="Pomerium">
    O Pomerium transmite a identidade em `x-pomerium-claim-email` (ou outros cabeçalhos de declaração) e um JWT em `x-pomerium-jwt-assertion`.

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

    Trecho da configuração do Pomerium:

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
    O Caddy com o plugin `caddy-security` pode autenticar usuários e transmitir cabeçalhos de identidade.

    ```json5
    {
      gateway: {
        bind: "lan",
    ```
    ```json5
        trustedProxies: ["10.0.0.1"], // IP do proxy Caddy/sidecar
    ```
    ```json5
        auth: {
    ```
    ```json5
          mode: "trusted-proxy",
    ```
    ```json5
          trustedProxy: {
            userHeader: "x-forwarded-user",
          },
        },
      },
    }
    ```
    Trecho do Caddyfile:

    ```caddy
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
    O oauth2-proxy autentica os usuários e transmite a identidade em `x-auth-request-email`.

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
  <Accordion title="Traefik com autenticação encaminhada">
    ```json5
    {
      gateway: {
        bind: "lan",
        trustedProxies: ["172.17.0.1"], // IP do contêiner do Traefik
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

A inicialização do Gateway rejeita a autenticação por proxy confiável se um token compartilhado também estiver configurado (`gateway.auth.token` ou `OPENCLAW_GATEWAY_TOKEN`). Os dois são mutuamente exclusivos porque um token compartilhado permitiria que chamadores no mesmo host se autenticassem por um caminho completamente diferente da identidade verificada pelo proxy que este modo deve impor.

Se a inicialização falhar com um erro como `gateway auth mode is trusted-proxy, but a shared token is also configured`:

- Remova o token compartilhado ao usar o modo de proxy confiável, ou
- Altere `gateway.auth.mode` para `"token"` se você pretende usar autenticação baseada em token.

Os cabeçalhos de identidade de proxy confiável no loopback ainda falham de forma segura: chamadores no mesmo host não são autenticados silenciosamente como usuários do proxy. Em vez disso, chamadores internos do OpenClaw que contornam o proxy podem se autenticar com `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`. O fallback para token permanece intencionalmente incompatível com o modo de proxy confiável.

  ## Lista de verificação de segurança

  Antes de habilitar a autenticação por proxy confiável, verifique:

  - [ ] **O proxy é o único caminho**: A porta do Gateway está protegida por firewall contra tudo, exceto seu proxy.
  - [ ] **trustedProxies é mínimo**: Somente os IPs reais do seu proxy, não sub-redes inteiras.
  - [ ] **A origem de loopback do proxy é deliberada**: A autenticação por proxy confiável falha de forma segura para solicitações provenientes de loopback, a menos que `gateway.auth.trustedProxy.allowLoopback` seja explicitamente habilitado para um proxy no mesmo host.
  - [ ] **O proxy remove cabeçalhos**: Seu proxy sobrescreve (não acrescenta) os cabeçalhos `x-forwarded-*` dos clientes.
  - [ ] **Terminação TLS**: Seu proxy gerencia o TLS; os usuários se conectam via HTTPS.
  - [ ] **allowedOrigins é explícito**: A Control UI fora do loopback usa `gateway.controlUi.allowedOrigins` explícito.
  - [ ] **allowUsers está definido** (recomendado): Restrinja a usuários conhecidos em vez de permitir qualquer pessoa autenticada.
  - [ ] **Nenhuma configuração mista de token**: Não defina `gateway.auth.token` e `gateway.auth.mode: "trusted-proxy"` simultaneamente.
  - [ ] **O fallback de senha local é privado**: Se você configurar `gateway.auth.password` para chamadores internos diretos, mantenha a porta do Gateway protegida por firewall para que clientes remotos que não passam pelo proxy não possam acessá-la diretamente.

  ## Auditoria de segurança

  `openclaw security audit` sinaliza a autenticação por proxy confiável com uma constatação de severidade **crítica**. Isso é intencional; é um lembrete de que você está delegando a segurança à configuração do seu proxy.

  A auditoria verifica:

  - Aviso/lembrete crítico básico de `gateway.trusted_proxy_auth`.
  - Ausência da configuração `trustedProxies`.
  - Ausência da configuração `userHeader`.
  - `allowUsers` vazio (permite qualquer usuário autenticado).
  - `allowLoopback` habilitado para origens de proxy no mesmo host.

  Constatações separadas, não específicas de proxy confiável, também se aplicam sempre que a Control UI está exposta: `gateway.controlUi.allowedOrigins` curinga ou ausente e fallback de origem pelo cabeçalho Host.

  ## Solução de problemas

  <AccordionGroup>
  <Accordion title="trusted_proxy_untrusted_source">
    A solicitação não veio de um IP em `gateway.trustedProxies`. Verifique:

    - O IP do proxy está correto? (Os IPs de contêineres Docker podem mudar.)
    - Há um balanceador de carga na frente do seu proxy?
    - Use `docker inspect` ou `kubectl get pods -o wide` para encontrar os IPs reais.

  </Accordion>
  <Accordion title="trusted_proxy_loopback_source">
    O OpenClaw rejeitou uma solicitação de proxy confiável proveniente de loopback.

    Verifique:

    - O proxy está se conectando a partir de `127.0.0.1` / `::1`?
    - Você está tentando usar autenticação por proxy confiável com um proxy reverso de loopback no mesmo host?

    Correção:

    - Prefira autenticação por token/senha para clientes internos no mesmo host que não passam pelo proxy, ou
    - Encaminhe por um endereço de proxy confiável que não seja de loopback e mantenha esse IP em `gateway.trustedProxies`, ou
    - Para um proxy reverso intencional no mesmo host, defina `gateway.auth.trustedProxy.allowLoopback = true`, mantenha o endereço de loopback em `gateway.trustedProxies` e garanta que o proxy remova ou sobrescreva os cabeçalhos de identidade.

  </Accordion>
  <Accordion title="trusted_proxy_local_interface_source / trusted_proxy_local_interface_check_failed">
    O IP de origem da solicitação correspondeu a um dos endereços de interface de rede sem loopback do próprio host do Gateway (não ao proxy), uma proteção contra tráfego falsificado do mesmo host em tailnets ou redes de ponte do Docker. `..._check_failed` significa que a própria descoberta da interface apresentou um erro, portanto o OpenClaw bloqueia por padrão.

    Verifique:

    - Um processo no próprio host do Gateway está enviando cabeçalhos de identidade diretamente, ignorando o proxy?
    - O proxy é executado no mesmo namespace de rede que o Gateway, com um IP que também aparece como uma interface local?

    Correção: encaminhe o tráfego do proxy por um endereço que também não esteja vinculado localmente pelo host do Gateway ou use `allowLoopback` somente para uma configuração genuína de proxy no mesmo host.

  </Accordion>
  <Accordion title="trusted_proxy_user_missing">
    O cabeçalho do usuário estava vazio ou ausente. Verifique:

    - Seu proxy está configurado para encaminhar cabeçalhos de identidade?
    - O nome do cabeçalho está correto? (não diferencia maiúsculas de minúsculas, mas a grafia é importante)
    - O usuário está realmente autenticado no proxy?

  </Accordion>
  <Accordion title="trusted_proxy_missing_header_*">
    Um cabeçalho obrigatório não estava presente. Verifique:

    - A configuração do proxy para esses cabeçalhos específicos.
    - Se os cabeçalhos estão sendo removidos em algum ponto da cadeia.

  </Accordion>
  <Accordion title="trusted_proxy_user_not_allowed">
    O usuário está autenticado, mas não está em `allowUsers`. Adicione-o ou remova a lista de permissões.
  </Accordion>
  <Accordion title="trusted_proxy_no_proxies_configured / trusted_proxy_config_missing">
    `gateway.auth.mode` é `"trusted-proxy"`, mas `gateway.trustedProxies` está vazio ou o próprio `gateway.auth.trustedProxy` está ausente. Todas as solicitações são rejeitadas até que ambos sejam definidos.
  </Accordion>
  <Accordion title="trusted_proxy_origin_not_allowed">
    A autenticação por proxy confiável foi bem-sucedida, mas o cabeçalho `Origin` do navegador não passou nas verificações de origem da interface de controle.

    Verifique:

    - `gateway.controlUi.allowedOrigins` inclui a origem exata do navegador.
    - Você não está dependendo de origens curinga, a menos que queira intencionalmente permitir todas as origens.
    - Se você usa intencionalmente o modo de fallback pelo cabeçalho Host, `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback=true` foi definido deliberadamente.

  </Accordion>
  <Accordion title="A conexão é bem-sucedida, mas os métodos informam escopo ausente">
    O WebSocket se conecta, mas `chat.history`, `sessions.list` ou
    `models.list` falha com `missing scope: operator.read`.

    Causas comuns:

    - Sessão da interface de controle sem dispositivo: a autenticação por proxy confiável pode admitir a conexão WebSocket sem identidade do dispositivo, mas o OpenClaw remove os escopos de sessões sem dispositivo por design.
    - Cliente de backend personalizado: `gateway.controlUi.dangerouslyDisableDeviceAuth` tem escopo restrito à interface de controle e não concede escopos a clientes WebSocket arbitrários de backend ou com formato de CLI.
    - `x-openclaw-scopes` excessivamente restrito: se seu proxy injetar esse cabeçalho na solicitação de upgrade do WebSocket da interface de controle, os escopos da sessão serão limitados a esse conjunto. Um valor de cabeçalho vazio não concede nenhum escopo.

    Correção:

    - Para a interface de controle, use HTTPS para que o navegador possa gerar a identidade do dispositivo e concluir o pareamento.
    - Para automação personalizada, use identidade/pareamento do dispositivo, o caminho auxiliar reservado de backend local direto `gateway-client` ou a [RPC HTTP administrativa](/pt-BR/plugins/admin-http-rpc).
    - Use `gateway.controlUi.dangerouslyDisableDeviceAuth: true` somente como um recurso temporário de emergência para a interface de controle.

  </Accordion>
  <Accordion title="O WebSocket continua falhando">
    Garanta que seu proxy:

    - Ofereça suporte a upgrades do WebSocket (`Upgrade: websocket`, `Connection: upgrade`).
    - Encaminhe os cabeçalhos de identidade em solicitações de upgrade do WebSocket (não apenas em HTTP).
    - Não tenha um caminho de autenticação separado para conexões WebSocket.

  </Accordion>
</AccordionGroup>

## Migração da autenticação por token

<Steps>
  <Step title="Configurar o proxy">
    Configure seu proxy para autenticar usuários e encaminhar cabeçalhos.
  </Step>
  <Step title="Testar o proxy de forma independente">
    Teste a configuração do proxy de forma independente (curl com cabeçalhos).
  </Step>
  <Step title="Atualizar a configuração do OpenClaw">
    Atualize a configuração do OpenClaw com autenticação por proxy confiável.
  </Step>
  <Step title="Reiniciar o Gateway">
    Reinicie o Gateway.
  </Step>
  <Step title="Testar o WebSocket">
    Teste as conexões WebSocket a partir da interface de controle.
  </Step>
  <Step title="Auditar">
    Execute `openclaw security audit` e analise as constatações.
  </Step>
</Steps>

## Relacionados

- [Configuração](/pt-BR/gateway/configuration) — referência de configuração
- [Escopos do operador](/pt-BR/gateway/operator-scopes) — funções, escopos e verificações de aprovação
- [Acesso remoto](/pt-BR/gateway/remote) — outros padrões de acesso remoto
- [Segurança](/pt-BR/gateway/security) — guia completo de segurança
- [Tailscale](/pt-BR/gateway/tailscale) — alternativa mais simples para acesso exclusivo pela tailnet
