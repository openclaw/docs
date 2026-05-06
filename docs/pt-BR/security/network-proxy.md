---
read_when:
    - Você quer defesa em profundidade contra ataques de SSRF e religação de DNS
    - Configurando um proxy de encaminhamento externo para o tráfego em tempo de execução do OpenClaw
summary: Como rotear o tráfego HTTP e WebSocket em tempo de execução do OpenClaw por meio de um proxy de filtragem gerenciado pelo operador
title: Proxy de rede
x-i18n:
    generated_at: "2026-05-06T18:00:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: aed1cd94ce6a32cd8a3f6c7e579011992af87c1ccc40eb53efaa83b020a6792b
    source_path: security/network-proxy.md
    workflow: 16
---

OpenClaw pode rotear tráfego HTTP e WebSocket em runtime por meio de um proxy de encaminhamento gerenciado pelo operador. Essa é uma defesa em profundidade opcional para implantações que desejam controle central de egresso, proteção mais forte contra SSRF e melhor auditabilidade de rede.

OpenClaw não envia, baixa, inicia, configura nem certifica um proxy. Você executa a tecnologia de proxy que se encaixa no seu ambiente, e o OpenClaw roteia clientes HTTP e WebSocket normais, locais ao processo, por meio dele.

## Por que usar um proxy

Um proxy dá aos operadores um ponto único de controle de rede para tráfego HTTP e WebSocket de saída. Isso pode ser útil mesmo fora do reforço contra SSRF:

- Política central: mantenha uma única política de egresso em vez de depender de cada ponto de chamada HTTP da aplicação para aplicar as regras de rede corretamente.
- Verificações no momento da conexão: avalie o destino após a resolução DNS e imediatamente antes de o proxy abrir a conexão upstream.
- Defesa contra DNS rebinding: reduza o intervalo entre uma verificação DNS no nível da aplicação e a conexão de saída real.
- Cobertura JavaScript mais ampla: roteie clientes comuns como `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e similares pelo mesmo caminho.
- Auditabilidade: registre destinos permitidos e negados no limite de egresso.
- Controle operacional: aplique regras de destino, segmentação de rede, limites de taxa ou allowlists de saída sem recompilar o OpenClaw.

O roteamento por proxy é uma proteção no nível do processo para egresso HTTP e WebSocket normal. Ele dá aos operadores um caminho fail-closed para rotear clientes HTTP JavaScript compatíveis pelo proxy de filtragem deles, mas não é um sandbox de rede no nível do sistema operacional e não faz o OpenClaw certificar a política de destinos do proxy.

## Como o OpenClaw roteia tráfego

Quando `proxy.enabled=true` e uma URL de proxy está configurada, processos de runtime protegidos, como `openclaw gateway run`, `openclaw node run` e `openclaw agent --local`, roteiam o egresso HTTP e WebSocket normal pelo proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

O contrato público é o comportamento de roteamento, não os hooks internos do Node usados para implementá-lo. Clientes WebSocket do plano de controle do OpenClaw Gateway usam um caminho direto estreito para tráfego RPC do Gateway de local loopback quando a URL do Gateway usa `localhost` ou um IP literal de loopback, como `127.0.0.1` ou `[::1]`. Esse caminho do plano de controle precisa conseguir alcançar Gateways de loopback mesmo quando o proxy do operador bloqueia destinos de loopback. Requisições HTTP e WebSocket normais de runtime ainda usam o proxy configurado.

Internamente, o OpenClaw usa dois hooks de roteamento no nível do processo para esse recurso:

- O roteamento por dispatcher do Undici cobre `fetch`, clientes baseados em undici e transportes que fornecem seu próprio dispatcher do undici.
- O roteamento de `global-agent` cobre chamadores do núcleo do Node `node:http` e `node:https`, incluindo muitas bibliotecas em camadas sobre `http.request`, `https.request`, `http.get` e `https.get`. O modo de proxy gerenciado força esse agente global para que agentes HTTP explícitos do Node não ignorem acidentalmente o proxy do operador.

Alguns plugins possuem transportes customizados que precisam de configuração explícita de proxy mesmo quando existe roteamento no nível do processo. Por exemplo, o transporte da Bot API do Telegram usa seu próprio dispatcher HTTP/1 do undici e, portanto, respeita o ambiente de proxy do processo mais o fallback gerenciado `OPENCLAW_PROXY_URL` nesse caminho de transporte específico do proprietário.

A própria URL do proxy deve usar `http://`. Destinos HTTPS ainda são compatíveis por meio do proxy com HTTP `CONNECT`; isso significa apenas que o OpenClaw espera um listener de proxy de encaminhamento HTTP simples, como `http://127.0.0.1:3128`.

Enquanto o proxy está ativo, o OpenClaw limpa `no_proxy`, `NO_PROXY` e `GLOBAL_AGENT_NO_PROXY`. Essas listas de bypass são baseadas em destino, então deixar `localhost` ou `127.0.0.1` nelas permitiria que destinos SSRF de alto risco ignorassem o proxy de filtragem.

No encerramento, o OpenClaw restaura o ambiente de proxy anterior e redefine o estado de roteamento de processo em cache.

## Termos relacionados a proxy

- `proxy.enabled` / `proxy.proxyUrl`: roteamento por proxy de encaminhamento de saída para egresso de runtime do OpenClaw. Esta página documenta esse recurso.
- `gateway.auth.mode: "trusted-proxy"`: autenticação de proxy reverso de entrada com reconhecimento de identidade para acesso ao Gateway. Consulte [Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy local de depuração e inspetor de captura para desenvolvimento e suporte. Consulte [openclaw proxy](/pt-BR/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opção explícita para `web_fetch` permitir que um proxy de ambiente HTTP(S) controlado pelo operador resolva DNS, mantendo a política padrão estrita de fixação de DNS e hostname. Consulte [Busca na Web](/pt-BR/tools/web-fetch#trusted-env-proxy).
- Configurações de proxy específicas de canal ou provedor: substituições específicas do proprietário para um transporte específico. Prefira o proxy de rede gerenciado quando o objetivo for controle central de egresso em todo o runtime.

## Configuração

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Você também pode fornecer a URL por meio do ambiente, mantendo `proxy.enabled=true` na configuração:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` tem precedência sobre `OPENCLAW_PROXY_URL`.

### Modo de loopback do Gateway

Clientes locais do plano de controle do Gateway geralmente se conectam a um WebSocket de loopback, como `ws://127.0.0.1:18789`. Use `proxy.loopbackMode` para escolher como esse tráfego se comporta enquanto o proxy gerenciado está ativo:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (padrão): o OpenClaw registra a autoridade de loopback do Gateway no controlador `NO_PROXY` ativo de `global-agent`, para que o tráfego WebSocket local do Gateway possa se conectar diretamente. Portas customizadas de Gateway em loopback funcionam porque o host e a porta da URL ativa do Gateway são registrados.
- `proxy`: o OpenClaw não registra uma autoridade `NO_PROXY` de loopback do Gateway, então o tráfego local do Gateway é enviado pelo proxy gerenciado. Se o proxy for remoto, ele deverá fornecer roteamento especial para o serviço de loopback do host do OpenClaw, como mapeá-lo para um hostname, IP ou túnel alcançável pelo proxy. Proxies remotos padrão resolvem `127.0.0.1` e `localhost` a partir do host do proxy, não a partir do host do OpenClaw.
- `block`: o OpenClaw nega conexões de loopback do plano de controle do Gateway antes de abrir um socket.

Se `enabled=true`, mas nenhuma URL de proxy válida estiver configurada, os comandos protegidos falham na inicialização em vez de retornar ao acesso direto à rede.

Para serviços gerenciados de gateway iniciados com `openclaw gateway start`, prefira armazenar a URL na configuração:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

O fallback por ambiente é melhor para execuções em primeiro plano. Se você o usar com um serviço instalado, coloque `OPENCLAW_PROXY_URL` no ambiente durável do serviço, como `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, depois reinstale o serviço para que launchd, systemd ou Scheduled Tasks iniciem o gateway com esse valor.

Para comandos `openclaw --container ...`, o OpenClaw encaminha `OPENCLAW_PROXY_URL` para a CLI filha destinada ao contêiner quando ele está definido. A URL precisa ser alcançável de dentro do contêiner; `127.0.0.1` refere-se ao próprio contêiner, não ao host. O OpenClaw rejeita URLs de proxy de loopback para comandos destinados a contêiner, a menos que você substitua explicitamente essa verificação de segurança.

## Requisitos do proxy

A política do proxy é o limite de segurança. O OpenClaw não consegue verificar se o proxy bloqueia os destinos corretos.

Configure o proxy para:

- Vincular-se apenas ao loopback ou a uma interface privada confiável.
- Restringir o acesso para que somente o processo, host, contêiner ou conta de serviço do OpenClaw possa usá-lo.
- Resolver destinos por conta própria e bloquear IPs de destino após a resolução DNS.
- Aplicar política no momento da conexão tanto para requisições HTTP simples quanto para túneis HTTPS `CONNECT`.
- Rejeitar bypasses baseados em destino para faixas de loopback, privadas, link-local, metadados, multicast, reservadas ou de documentação.
- Evitar allowlists de hostname, a menos que você confie totalmente no caminho de resolução DNS.
- Registrar destino, decisão, status e motivo sem registrar corpos de requisição, cabeçalhos de autorização, cookies ou outros segredos.
- Manter a política de proxy sob controle de versão e revisar alterações como configuração sensível à segurança.

## Destinos bloqueados recomendados

Use esta lista de negação como ponto de partida para qualquer proxy de encaminhamento, firewall ou política de egresso.

A lógica de classificação no nível da aplicação do OpenClaw fica em `src/infra/net/ssrf.ts` e `src/shared/net/ip.ts`. Os hooks de paridade relevantes são `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e o tratamento de sentinela IPv4 embutido para formas NAT64, 6to4, Teredo, ISATAP e IPv4-mapped. Esses arquivos são referências úteis ao manter uma política de proxy externa, mas o OpenClaw não exporta nem aplica automaticamente essas regras no seu proxy.

| Faixa ou host                                                                        | Por que bloquear                                   |
| ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                      |
| `::1/128`                                                                            | Loopback IPv6                                      |
| `0.0.0.0/8`, `::/128`                                                                | Endereços não especificados e desta rede           |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC1918                             |
| `169.254.0.0/16`, `fe80::/10`                                                        | Endereços link-local e caminhos comuns de metadados em nuvem |
| `169.254.169.254`, `metadata.google.internal`                                        | Serviços de metadados em nuvem                     |
| `100.64.0.0/10`                                                                      | Espaço de endereços compartilhado de NAT carrier-grade |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Faixas de benchmarking                             |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Faixas de uso especial e documentação              |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                          |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                     |
| `fc00::/7`, `fec0::/10`                                                              | Faixas IPv6 locais/privadas                        |
| `100::/64`, `2001:20::/28`                                                           | Faixas IPv6 discard e ORCHIDv2                     |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefixos NAT64 com IPv4 embutido                   |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo com IPv4 embutido                    |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatível com IPv4 e IPv6 IPv4-mapped        |

Se seu provedor de nuvem ou plataforma de rede documentar hosts de metadados ou faixas reservadas adicionais, adicione-os também.

## Validação

Valide o proxy a partir do mesmo host, contêiner ou conta de serviço que executa o OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Por padrão, quando nenhum destino personalizado é fornecido, o comando verifica se `https://example.com/` é bem-sucedido e inicia um canário de loopback temporário que o proxy não deve alcançar. A verificação negada padrão passa quando o proxy retorna uma resposta de negação não 2xx ou bloqueia o canário com uma falha de transporte; ela falha se uma resposta bem-sucedida alcançar o canário. Se nenhum proxy estiver habilitado e configurado, a validação relata um problema de configuração; use `--proxy-url` para uma pré-verificação pontual antes de alterar a configuração. Use `--allowed-url` e `--denied-url` para testar expectativas específicas da implantação. Adicione `--apns-reachable` para também verificar se a entrega direta de APNs por HTTP/2 consegue abrir um túnel CONNECT pelo proxy e receber uma resposta de APNs sandbox; a sondagem usa um token de provedor intencionalmente inválido, portanto `403 InvalidProviderToken` é esperado e conta como alcançável. Destinos negados personalizados falham em modo fechado: qualquer resposta HTTP significa que o destino estava alcançável pelo proxy, e qualquer erro de transporte é relatado como inconclusivo porque o OpenClaw não consegue provar que o proxy bloqueou uma origem alcançável. Em caso de falha na validação, o comando sai com o código 1.

Use `--json` para automação. A saída JSON contém o resultado geral, a origem efetiva da configuração do proxy, quaisquer erros de configuração e cada verificação de destino. As credenciais da URL do proxy são redigidas na saída de texto e JSON:

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

A requisição pública deve ser bem-sucedida. As requisições de loopback e metadados devem ser bloqueadas pelo proxy. Para `openclaw proxy validate`, o canário de loopback integrado consegue distinguir uma negação do proxy de uma origem alcançável. Verificações personalizadas de `--denied-url` não têm esse canário, portanto trate tanto respostas HTTP quanto falhas de transporte ambíguas como falhas de validação, a menos que seu proxy exponha um sinal de negação específico da implantação que você possa verificar separadamente.

Em seguida, habilite o roteamento de proxy do OpenClaw:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway run
```

ou defina:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

## Limites

- O proxy melhora a cobertura para clientes HTTP e WebSocket JavaScript locais ao processo, mas não é um sandbox de rede em nível de sistema operacional.
- O tráfego do plano de controle de loopback do Gateway usa, por padrão, um desvio local direto por meio de `proxy.loopbackMode: "gateway-only"`. O OpenClaw implementa esse desvio registrando a autoridade de loopback do Gateway ativo no controlador `NO_PROXY` gerenciado do `global-agent`. Operadores podem definir `proxy.loopbackMode: "proxy"` para enviar o tráfego de loopback do Gateway pelo proxy gerenciado, ou `proxy.loopbackMode: "block"` para negar conexões de loopback do Gateway. Consulte [Modo de Loopback do Gateway](#gateway-loopback-mode) para a ressalva sobre proxy remoto.
- Sockets brutos `net`, `tls` e `http2`, addons nativos e processos filhos que não são do OpenClaw podem desviar do roteamento de proxy em nível de Node, a menos que herdem e respeitem variáveis de ambiente de proxy. CLIs filhos do OpenClaw bifurcados herdam a URL do proxy gerenciado e o estado de `proxy.loopbackMode`.
- IRC é um canal TCP/TLS bruto fora do roteamento de proxy de encaminhamento gerenciado pelo operador. Em implantações que exigem todo o tráfego de saída por esse proxy de encaminhamento, defina `channels.irc.enabled=false`, a menos que a saída direta de IRC seja explicitamente aprovada.
- O proxy local de depuração é uma ferramenta de diagnóstico, e seu encaminhamento upstream direto para requisições de proxy e túneis CONNECT é desabilitado por padrão enquanto o modo de proxy gerenciado está ativo; habilite o encaminhamento direto somente para diagnósticos locais aprovados.
- WebUIs locais do usuário e servidores locais de modelo devem ser incluídos na lista de permissões na política de proxy do operador quando necessário; o OpenClaw não expõe um desvio geral de rede local para eles.
- O desvio de proxy do plano de controle do Gateway é intencionalmente limitado a URLs de `localhost` e IPs literais de loopback. Use `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` para conexões locais diretas do plano de controle do Gateway; outros nomes de host são roteados como tráfego comum baseado em nome de host.
- O OpenClaw não inspeciona, testa nem certifica sua política de proxy.
- Trate alterações na política de proxy como alterações operacionais sensíveis à segurança.
