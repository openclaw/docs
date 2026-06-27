---
read_when:
    - Você quer defesa em profundidade contra ataques de SSRF e DNS rebinding
    - Configurando um proxy de encaminhamento externo para o tráfego de runtime do OpenClaw
summary: Como rotear o tráfego HTTP e WebSocket do runtime do OpenClaw por meio de um proxy de filtragem gerenciado pelo operador
title: Proxy de rede
x-i18n:
    generated_at: "2026-06-27T18:11:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3fc68d950037922ba3dc983c94a71bac3374750a02ef25f2c046cf782410be68
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw pode rotear tráfego HTTP e WebSocket de runtime por meio de um proxy de encaminhamento gerenciado pelo operador. Esta é uma defesa em profundidade opcional para implantações que desejam controle central de saída, proteção SSRF mais forte e melhor auditabilidade de rede.

OpenClaw não fornece, baixa, inicia, configura nem certifica um proxy. Você executa a tecnologia de proxy adequada ao seu ambiente, e o OpenClaw roteia clientes HTTP e WebSocket locais ao processo por meio dela.

## Por que usar um proxy

Um proxy oferece aos operadores um único ponto de controle de rede para tráfego HTTP e WebSocket de saída. Isso pode ser útil mesmo além do reforço contra SSRF:

- Política central: mantenha uma política de saída em vez de depender de cada ponto de chamada HTTP da aplicação para acertar as regras de rede.
- Verificações no momento da conexão: avalie o destino após a resolução de DNS e imediatamente antes de o proxy abrir a conexão upstream.
- Defesa contra DNS rebinding: reduza a lacuna entre uma verificação de DNS em nível de aplicação e a conexão de saída real.
- Cobertura mais ampla de JavaScript: roteie `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e clientes semelhantes pelo mesmo caminho.
- Auditabilidade: registre destinos permitidos e negados no limite de saída.
- Controle operacional: aplique regras de destino, segmentação de rede, limites de taxa ou listas de permissão de saída sem recompilar o OpenClaw.

O roteamento por proxy é uma proteção em nível de processo para saída HTTP e WebSocket normal. Ele oferece aos operadores um caminho que falha fechado para rotear clientes HTTP JavaScript compatíveis por meio do seu próprio proxy de filtragem, mas não é um sandbox de rede em nível de SO e não faz o OpenClaw certificar a política de destino do proxy.

## Como o OpenClaw roteia tráfego

Quando `proxy.enabled=true` e uma URL de proxy está configurada, processos de runtime protegidos, como `openclaw gateway run`, `openclaw node run` e `openclaw agent --local`, roteiam a saída HTTP e WebSocket normal pelo proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

O contrato público é o comportamento de roteamento, não os hooks internos do Node usados para implementá-lo. Clientes WebSocket do plano de controle do OpenClaw Gateway usam um caminho direto estreito para tráfego RPC do Gateway por local loopback quando a URL do Gateway usa `localhost` ou um IP literal de loopback, como `127.0.0.1` ou `[::1]`. Esse caminho do plano de controle precisa conseguir alcançar Gateways em loopback mesmo quando o proxy do operador bloqueia destinos de loopback. Requisições HTTP e WebSocket normais de runtime ainda usam o proxy configurado.

Internamente, o OpenClaw instala o Proxyline como runtime de roteamento em nível de processo para este recurso. O Proxyline cobre `fetch`, clientes baseados em undici, chamadores do núcleo do Node `node:http` / `node:https`, clientes WebSocket comuns e túneis CONNECT criados por helpers. O modo de proxy gerenciado substitui agentes HTTP do Node fornecidos pelo chamador, para que agentes explícitos não contornem acidentalmente o proxy do operador.

Alguns plugins possuem transportes personalizados que precisam de configuração explícita de proxy mesmo quando o roteamento em nível de processo existe. Por exemplo, o transporte da Bot API do Telegram usa seu próprio dispatcher HTTP/1 do undici e, portanto, respeita o ambiente de proxy do processo mais o fallback gerenciado `OPENCLAW_PROXY_URL` nesse caminho de transporte específico do proprietário.

A própria URL do proxy pode usar `http://` ou `https://`. Esses esquemas descrevem a conexão do OpenClaw ao endpoint do proxy:

- `http://proxy.example:3128`: o OpenClaw abre uma conexão TCP simples com o proxy de encaminhamento e envia requisições de proxy HTTP, incluindo `CONNECT` para destinos HTTPS.
- `https://proxy.example:8443`: o OpenClaw abre TLS para o endpoint do proxy, verifica o certificado do proxy e então envia requisições de proxy HTTP dentro dessa sessão TLS.

HTTPS do destino é separado do TLS do endpoint do proxy. Para um destino HTTPS, o OpenClaw ainda pede ao proxy um túnel HTTP `CONNECT` e então inicia o TLS do destino por esse túnel.

Enquanto o proxy está ativo, o OpenClaw limpa `no_proxy` e `NO_PROXY`. Essas listas de bypass são baseadas em destino, portanto deixar `localhost` ou `127.0.0.1` nelas permitiria que alvos SSRF de alto risco ignorassem o proxy de filtragem.

No desligamento, o OpenClaw restaura o ambiente de proxy anterior e redefine o estado de roteamento de processo em cache.

## Termos relacionados a proxy

- `proxy.enabled` / `proxy.proxyUrl`: roteamento por proxy de encaminhamento de saída para a saída de runtime do OpenClaw. Esta página documenta esse recurso.
- `gateway.auth.mode: "trusted-proxy"`: autenticação inbound por proxy reverso com reconhecimento de identidade para acesso ao Gateway. Consulte [autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy local de depuração e inspetor de captura para desenvolvimento e suporte. Consulte [openclaw proxy](/pt-BR/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opt-in para `web_fetch` permitir que um proxy de ambiente HTTP(S) controlado pelo operador resolva DNS enquanto mantém a fixação de DNS estrita e a política de hostname padrão. Consulte [busca web](/pt-BR/tools/web-fetch#trusted-env-proxy).
- Configurações de proxy específicas de canal ou provedor: substituições específicas do proprietário para um transporte específico. Prefira o proxy de rede gerenciado quando o objetivo for controle central de saída em todo o runtime.

## Configuração

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Para um endpoint de proxy HTTPS com uma CA de proxy privada:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Você também pode fornecer a URL pelo ambiente, mantendo `proxy.enabled=true` na configuração:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` tem precedência sobre `OPENCLAW_PROXY_URL`.

### Modo de Loopback do Gateway

Clientes locais do plano de controle do Gateway normalmente se conectam a um WebSocket de loopback, como `ws://127.0.0.1:18789`. Use `proxy.loopbackMode` para escolher como as exceções de proxy gerenciado para loopback se comportam enquanto o proxy gerenciado está ativo:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (padrão): o OpenClaw registra a autoridade de loopback do Gateway na política de bypass gerenciado do Proxyline para que o tráfego WebSocket local do Gateway possa se conectar diretamente. Portas personalizadas de Gateway em loopback funcionam porque o host e a porta da URL ativa do Gateway são registrados. O plugin de navegador incluído também pode registrar os endpoints exatos de prontidão CDP local e WebSocket do DevTools para navegadores gerenciados iniciados pelo OpenClaw, e o provedor de embeddings de memória Ollama incluído pode usar seu próprio caminho direto protegido mais estreito para a origem exata de embedding em loopback local ao host configurada.
- `proxy`: o OpenClaw não registra bypasses de loopback do Gateway ou Ollama, então esse tráfego de loopback é enviado pelo proxy gerenciado. Se o proxy for remoto, ele precisa fornecer roteamento especial para o serviço de loopback do host do OpenClaw, como mapeá-lo para um hostname, IP ou túnel alcançável pelo proxy. Proxies remotos padrão resolvem `127.0.0.1` e `localhost` a partir do host do proxy, não do host do OpenClaw.
- `block`: o OpenClaw nega conexões de plano de controle do Gateway em loopback e conexões de embedding Ollama protegidas em loopback local ao host antes de abrir um socket.

Se `enabled=true`, mas nenhuma URL de proxy válida estiver configurada, comandos protegidos falham na inicialização em vez de voltar ao acesso direto à rede.

Para serviços de gateway gerenciados iniciados com `openclaw gateway start`, prefira armazenar a URL na configuração:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

O fallback de ambiente é melhor para execuções em primeiro plano. Se você usá-lo com um serviço instalado, coloque `OPENCLAW_PROXY_URL` no ambiente durável do serviço, como `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, e então reinstale o serviço para que launchd, systemd ou Scheduled Tasks inicie o gateway com esse valor.

Para comandos `openclaw --container ...`, o OpenClaw encaminha `OPENCLAW_PROXY_URL` para a CLI filha direcionada ao contêiner quando ele está definido. A URL precisa ser alcançável de dentro do contêiner; `127.0.0.1` se refere ao próprio contêiner, não ao host. O OpenClaw rejeita URLs de proxy de loopback para comandos direcionados a contêiner, a menos que você substitua explicitamente essa verificação de segurança.

## Requisitos do Proxy

A política do proxy é o limite de segurança. O OpenClaw não consegue verificar se o proxy bloqueia os alvos corretos.

Configure o proxy para:

- Vincular-se apenas a loopback ou a uma interface privada confiável.
- Restringir o acesso para que apenas o processo, host, contêiner ou conta de serviço do OpenClaw possa usá-lo.
- Resolver destinos por conta própria e bloquear IPs de destino após a resolução de DNS.
- Aplicar a política no momento da conexão tanto para requisições HTTP simples quanto para túneis HTTPS `CONNECT`.
- Rejeitar bypasses baseados em destino para intervalos de loopback, privados, link-local, metadados, multicast, reservados ou de documentação.
- Evitar listas de permissão de hostname, a menos que você confie totalmente no caminho de resolução de DNS.
- Registrar destino, decisão, status e motivo sem registrar corpos de requisição, cabeçalhos de autorização, cookies ou outros segredos.
- Manter a política de proxy sob controle de versão e revisar alterações como configuração sensível à segurança.

## Destinos bloqueados recomendados

Use esta lista de bloqueio como ponto de partida para qualquer proxy de encaminhamento, firewall ou política de saída.

A lógica de classificação em nível de aplicação do OpenClaw fica em `src/infra/net/ssrf.ts` e `packages/net-policy/src/ip.ts`. Os hooks de paridade relevantes são `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e o tratamento de sentinela IPv4 incorporado para NAT64, 6to4, Teredo, ISATAP e formas mapeadas para IPv4. Esses arquivos são referências úteis ao manter uma política de proxy externa, mas o OpenClaw não exporta nem aplica automaticamente essas regras no seu proxy.

| Intervalo ou host                                                                       | Por que bloquear                                      |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                     | loopback IPv4                                         |
| `::1/128`                                                                               | loopback IPv6                                         |
| `0.0.0.0/8`, `::/128`                                                                   | Endereços não especificados e desta rede              |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                        | Redes privadas RFC1918                                |
| `169.254.0.0/16`, `fe80::/10`                                                          | Endereços link-local e caminhos comuns de metadados de nuvem |
| `169.254.169.254`, `metadata.google.internal`                                           | Serviços de metadados de nuvem                        |
| `100.64.0.0/10`                                                                         | Espaço de endereços compartilhado de NAT carrier-grade |
| `198.18.0.0/15`, `2001:2::/48`                                                         | Intervalos de benchmarking                            |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`    | Intervalos de uso especial e documentação             |
| `224.0.0.0/4`, `ff00::/8`                                                               | Multicast                                             |
| `240.0.0.0/4`                                                                           | IPv4 reservado                                        |
| `fc00::/7`, `fec0::/10`                                                                 | Intervalos IPv6 locais/privados                       |
| `100::/64`, `2001:20::/28`                                                              | Intervalos IPv6 discard e ORCHIDv2                    |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                        | Prefixos NAT64 com IPv4 incorporado                   |
| `2002::/16`, `2001::/32`                                                                | 6to4 e Teredo com IPv4 incorporado                    |
| `::/96`, `::ffff:0:0/96`                                                                | IPv6 compatível com IPv4 e IPv6 mapeado para IPv4     |

Se seu provedor de nuvem ou plataforma de rede documenta hosts de metadados ou intervalos reservados adicionais, adicione-os também.

## Validação

Valide o proxy a partir do mesmo host, contêiner ou conta de serviço que executa o OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Para um endpoint de proxy HTTPS assinado por uma CA privada:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

Por padrão, quando nenhum destino personalizado é fornecido, o comando verifica se `https://example.com/` é bem-sucedido e inicia um canário temporário de loopback que o proxy não deve alcançar. A verificação negada padrão passa quando o proxy retorna uma resposta de negação não 2xx ou bloqueia o canário com uma falha de transporte; ela falha se uma resposta bem-sucedida alcançar o canário. Se nenhum proxy estiver habilitado e configurado, a validação relata um problema de configuração; use `--proxy-url` para uma verificação preliminar pontual antes de alterar a configuração. Use `--allowed-url` e `--denied-url` para testar expectativas específicas da implantação. Adicione `--apns-reachable` para também verificar se a entrega direta APNs HTTP/2 consegue abrir um túnel CONNECT pelo proxy e receber uma resposta sandbox APNs; a sondagem usa um token de provedor intencionalmente inválido, portanto `403 InvalidProviderToken` é esperado e conta como alcançável. Destinos negados personalizados falham em modo fechado: qualquer resposta HTTP significa que o destino estava alcançável pelo proxy, e qualquer erro de transporte é relatado como inconclusivo porque o OpenClaw não consegue provar que o proxy bloqueou uma origem alcançável. Em caso de falha de validação, o comando sai com o código 1.

Use `--json` para automação. A saída JSON contém o resultado geral, a origem efetiva da configuração do proxy, quaisquer erros de configuração e cada verificação de destino. Credenciais de URL do proxy são redigidas na saída de texto e JSON:

```json
{
  "ok": true,
  "config": {
    "enabled": true,
    "proxyUrl": "http://127.0.0.1:3128/",
    "source": "override",
    "errors": []
  },
  "checks": [
    {
      "kind": "allowed",
      "url": "https://example.com/",
      "ok": true,
      "status": 200
    },
    {
      "kind": "apns",
      "url": "https://api.sandbox.push.apple.com",
      "ok": true,
      "status": 403
    }
  ]
}
```

Você também pode validar manualmente com `curl`:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

A solicitação pública deve ser bem-sucedida. As solicitações de loopback e metadados devem ser bloqueadas pelo proxy. Para `openclaw proxy validate`, o canário de loopback integrado consegue distinguir uma negação do proxy de uma origem alcançável. Verificações personalizadas com `--denied-url` não têm esse canário, portanto trate tanto respostas HTTP quanto falhas de transporte ambíguas como falhas de validação, a menos que seu proxy exponha um sinal de negação específico da implantação que você possa verificar separadamente.

## Confiança na CA do proxy

Use `proxy.tls.caFile` gerenciado quando o próprio endpoint do proxy usa um certificado assinado por uma CA privada:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

Essa CA é usada para a verificação TLS do endpoint do proxy. Ela não é uma configuração de confiança MITM de destino, um certificado de cliente nem uma substituição para a política de destino do proxy.

Use `NODE_EXTRA_CA_CERTS` somente quando todo o processo Node precisar confiar em uma CA adicional desde a inicialização do processo, como quando um sistema corporativo de inspeção TLS assina novamente certificados de destino para cada cliente HTTPS no processo. `NODE_EXTRA_CA_CERTS` é global ao processo e deve estar presente antes que o Node inicie. Prefira `proxy.tls.caFile` para confiança no endpoint de proxy HTTPS porque ela é limitada ao roteamento de proxy gerenciado.

Em seguida, habilite o roteamento de proxy do OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

ou defina:

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

## Limites

- O proxy melhora a cobertura para clientes HTTP JavaScript locais ao processo e WebSocket, mas não é uma sandbox de rede em nível de SO.
- O tráfego de plano de controle de loopback do Gateway usa, por padrão, um bypass local direto por meio de `proxy.loopbackMode: "gateway-only"`. O OpenClaw implementa esse bypass registrando a autoridade de loopback ativa do Gateway na política de bypass gerenciado do Proxyline. Operadores podem definir `proxy.loopbackMode: "proxy"` para enviar tráfego de loopback do Gateway pelo proxy gerenciado, ou `proxy.loopbackMode: "block"` para negar conexões de loopback do Gateway. Consulte [Modo de loopback do Gateway](#gateway-loopback-mode) para a ressalva sobre proxy remoto.
- Sockets brutos `net`, `tls` e `http2`, addons nativos e processos filhos que não sejam do OpenClaw podem contornar o roteamento de proxy em nível de Node, a menos que herdem e respeitem variáveis de ambiente de proxy. CLIs filhos bifurcados do OpenClaw herdam a URL de proxy gerenciado e o estado de `proxy.loopbackMode`.
- IRC é um canal TCP/TLS bruto fora do roteamento de proxy de encaminhamento gerenciado pelo operador. Em implantações que exigem toda saída por esse proxy de encaminhamento, defina `channels.irc.enabled=false`, a menos que a saída direta de IRC seja aprovada explicitamente.
- O proxy de depuração local é uma ferramenta de diagnóstico, e seu encaminhamento direto upstream para solicitações de proxy e túneis CONNECT fica desabilitado por padrão enquanto o modo de proxy gerenciado está ativo; habilite o encaminhamento direto somente para diagnósticos locais aprovados.
- WebUIs locais de usuário e servidores de modelo locais devem ser allowlisted na política de proxy do operador quando necessário; o OpenClaw não expõe um bypass geral de rede local para eles. O provedor de embeddings de memória Ollama incluído é mais restrito: ele pode usar um caminho direto protegido somente para a origem exata de embedding de loopback local ao host derivada do `baseUrl` configurado, para que embeddings locais ao host continuem funcionando quando o proxy gerenciado não consegue alcançar o loopback do host. Hosts de embedding Ollama em LAN, tailnet, rede privada e públicos ainda usam o caminho do proxy gerenciado. `proxy.loopbackMode: "proxy"` envia esse tráfego de loopback Ollama pelo proxy gerenciado, e `proxy.loopbackMode: "block"` o nega antes de abrir uma conexão.
- O bypass de proxy do plano de controle do Gateway é intencionalmente limitado a `localhost` e URLs com IPs literais de loopback. Use `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` para conexões locais diretas de plano de controle do Gateway; outros nomes de host são roteados como tráfego comum baseado em nome de host.
- O OpenClaw não inspeciona, testa nem certifica sua política de proxy.
- Trate alterações na política de proxy como alterações operacionais sensíveis à segurança.

| Superfície                                                   | Status do proxy gerenciado                                                                         |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, clientes WebSocket comuns | Roteados por hooks de proxy gerenciado quando configurados.                                        |
| APNs direto HTTP/2                                           | Roteado pelo auxiliar CONNECT gerenciado de APNs.                                                   |
| Loopback do plano de controle do Gateway                     | Direto somente para a URL local de loopback do Gateway configurada.                                |
| Encaminhamento upstream do proxy de depuração                | Desabilitado enquanto o modo de proxy gerenciado está ativo, a menos que habilitado explicitamente para diagnósticos locais. |
| IRC                                                          | TCP/TLS bruto; não é proxificado pelo modo de proxy HTTP gerenciado. Desabilite, a menos que a saída direta de IRC seja aprovada. |
| Outras chamadas de cliente brutas `net`, `tls` ou `http2`    | Devem ser classificadas pela guarda de socket bruto antes de landing.                              |
