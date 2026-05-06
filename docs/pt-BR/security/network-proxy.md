---
read_when:
    - Você quer defesa em profundidade contra ataques de SSRF e de religação de DNS
    - Configurando um proxy de encaminhamento externo para o tráfego em tempo de execução do OpenClaw
summary: Como rotear o tráfego HTTP e WebSocket do tempo de execução do OpenClaw por meio de um proxy de filtragem gerenciado pelo operador
title: Proxy de rede
x-i18n:
    generated_at: "2026-05-06T09:13:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: d733c690b5f86ef62fe7a35d38fbfcd07910970bca12ca6f74fdb26c8ec4557b
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy de rede

O OpenClaw pode rotear tráfego HTTP e WebSocket de runtime por meio de um proxy de encaminhamento gerenciado pelo operador. Essa é uma defesa opcional em profundidade para implantações que querem controle central de saída, proteção mais forte contra SSRF e melhor auditabilidade de rede.

O OpenClaw não fornece, baixa, inicia, configura nem certifica um proxy. Você executa a tecnologia de proxy adequada ao seu ambiente, e o OpenClaw roteia clientes HTTP e WebSocket locais ao processo normais por meio dela.

## Por que usar um proxy?

Um proxy dá aos operadores um ponto único de controle de rede para tráfego HTTP e WebSocket de saída. Isso pode ser útil até fora do reforço contra SSRF:

- Política central: mantenha uma política de saída em vez de depender de cada ponto de chamada HTTP da aplicação para acertar as regras de rede.
- Verificações no momento da conexão: avalie o destino após a resolução DNS e imediatamente antes de o proxy abrir a conexão upstream.
- Defesa contra DNS rebinding: reduza a lacuna entre uma verificação DNS no nível da aplicação e a conexão de saída real.
- Cobertura JavaScript mais ampla: roteie clientes comuns como `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e similares pelo mesmo caminho.
- Auditabilidade: registre destinos permitidos e negados no limite de saída.
- Controle operacional: aplique regras de destino, segmentação de rede, limites de taxa ou listas de permissão de saída sem recompilar o OpenClaw.

O roteamento por proxy é uma proteção no nível do processo para saída HTTP e WebSocket normal. Ele dá aos operadores um caminho fail-closed para rotear clientes HTTP JavaScript compatíveis por meio do seu próprio proxy de filtragem, mas não é uma sandbox de rede no nível do sistema operacional e não faz o OpenClaw certificar a política de destino do proxy.

## Como o OpenClaw roteia tráfego

Quando `proxy.enabled=true` e uma URL de proxy está configurada, processos de runtime protegidos como `openclaw gateway run`, `openclaw node run` e `openclaw agent --local` roteiam a saída HTTP e WebSocket normal pelo proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

O contrato público é o comportamento de roteamento, não os hooks internos do Node usados para implementá-lo. Clientes WebSocket do plano de controle do OpenClaw Gateway usam um caminho direto restrito para tráfego RPC do Gateway em local loopback quando a URL do Gateway usa `localhost` ou um IP literal de loopback, como `127.0.0.1` ou `[::1]`. Esse caminho de plano de controle deve conseguir alcançar Gateways de loopback mesmo quando o proxy do operador bloqueia destinos de loopback. Solicitações HTTP e WebSocket normais de runtime ainda usam o proxy configurado.

Internamente, o OpenClaw usa dois hooks de roteamento no nível do processo para este recurso:

- O roteamento por dispatcher do Undici cobre `fetch`, clientes baseados em undici e transportes que fornecem seu próprio dispatcher undici.
- O roteamento por `global-agent` cobre chamadores do núcleo do Node `node:http` e `node:https`, incluindo muitas bibliotecas em camadas sobre `http.request`, `https.request`, `http.get` e `https.get`. O modo de proxy gerenciado força esse agente global para que agentes HTTP explícitos do Node não contornem acidentalmente o proxy do operador.

Alguns plugins são responsáveis por transportes personalizados que precisam de configuração explícita de proxy mesmo quando existe roteamento no nível do processo. Por exemplo, o transporte da Bot API do Telegram usa seu próprio dispatcher HTTP/1 do undici e, portanto, respeita o ambiente de proxy do processo mais o fallback gerenciado `OPENCLAW_PROXY_URL` nesse caminho de transporte específico do proprietário.

A própria URL do proxy deve usar `http://`. Destinos HTTPS ainda são compatíveis por meio do proxy com HTTP `CONNECT`; isso significa apenas que o OpenClaw espera um listener de proxy de encaminhamento HTTP simples, como `http://127.0.0.1:3128`.

Enquanto o proxy está ativo, o OpenClaw limpa `no_proxy`, `NO_PROXY` e `GLOBAL_AGENT_NO_PROXY`. Essas listas de bypass são baseadas no destino, então deixar `localhost` ou `127.0.0.1` nelas permitiria que alvos SSRF de alto risco ignorassem o proxy de filtragem.

No desligamento, o OpenClaw restaura o ambiente de proxy anterior e redefine o estado de roteamento de processo em cache.

## Termos relacionados a proxy

- `proxy.enabled` / `proxy.proxyUrl`: roteamento por proxy de encaminhamento de saída para egress de runtime do OpenClaw. Esta página documenta esse recurso.
- `gateway.auth.mode: "trusted-proxy"`: autenticação de proxy reverso de entrada com identidade para acesso ao Gateway. Consulte [autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy local de depuração e inspetor de captura para desenvolvimento e suporte. Consulte [openclaw proxy](/pt-BR/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opção de adesão para `web_fetch` permitir que um proxy HTTP(S) de ambiente controlado pelo operador resolva DNS, mantendo a fixação DNS estrita padrão e a política de hostname. Consulte [Busca na web](/pt-BR/tools/web-fetch#trusted-env-proxy).
- Configurações de proxy específicas de canal ou provedor: substituições específicas do proprietário para um transporte específico. Prefira o proxy de rede gerenciado quando o objetivo for controle central de saída em todo o runtime.

## Configuração

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Você também pode fornecer a URL pelo ambiente, mantendo `proxy.enabled=true` na configuração:

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

- `gateway-only` (padrão): o OpenClaw registra a autoridade de loopback do Gateway no controlador `NO_PROXY` ativo do `global-agent` para que o tráfego WebSocket local do Gateway possa se conectar diretamente. Portas personalizadas de Gateway de loopback funcionam porque o host e a porta da URL ativa do Gateway são registrados.
- `proxy`: o OpenClaw não registra uma autoridade `NO_PROXY` de loopback do Gateway, então o tráfego local do Gateway é enviado pelo proxy gerenciado. Se o proxy for remoto, ele deve fornecer roteamento especial para o serviço de loopback do host OpenClaw, como mapeá-lo para um hostname, IP ou túnel acessível pelo proxy. Proxies remotos padrão resolvem `127.0.0.1` e `localhost` a partir do host do proxy, não do host OpenClaw.
- `block`: o OpenClaw nega conexões de plano de controle do Gateway por loopback antes de abrir um socket.

Se `enabled=true`, mas nenhuma URL de proxy válida estiver configurada, comandos protegidos falham na inicialização em vez de voltar para acesso direto à rede.

Para serviços gerenciados de gateway iniciados com `openclaw gateway start`, prefira armazenar a URL na configuração:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

O fallback de ambiente é melhor para execuções em primeiro plano. Se você usá-lo com um serviço instalado, coloque `OPENCLAW_PROXY_URL` no ambiente durável do serviço, como `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, depois reinstale o serviço para que launchd, systemd ou Scheduled Tasks iniciem o gateway com esse valor.

Para comandos `openclaw --container ...`, o OpenClaw encaminha `OPENCLAW_PROXY_URL` para a CLI filha direcionada ao contêiner quando ele está definido. A URL deve ser acessível de dentro do contêiner; `127.0.0.1` se refere ao próprio contêiner, não ao host. O OpenClaw rejeita URLs de proxy de loopback para comandos direcionados a contêiner, a menos que você substitua explicitamente essa verificação de segurança.

## Requisitos do proxy

A política do proxy é o limite de segurança. O OpenClaw não consegue verificar se o proxy bloqueia os alvos corretos.

Configure o proxy para:

- Vincular apenas a loopback ou a uma interface privada confiável.
- Restringir o acesso para que apenas o processo, host, contêiner ou conta de serviço do OpenClaw possa usá-lo.
- Resolver destinos por conta própria e bloquear IPs de destino após a resolução DNS.
- Aplicar política no momento da conexão para solicitações HTTP simples e túneis HTTPS `CONNECT`.
- Rejeitar bypasses baseados em destino para faixas de loopback, privadas, link-local, metadados, multicast, reservadas ou de documentação.
- Evitar listas de permissão de hostname, a menos que você confie totalmente no caminho de resolução DNS.
- Registrar destino, decisão, status e motivo sem registrar corpos de solicitação, cabeçalhos de autorização, cookies ou outros segredos.
- Manter a política do proxy sob controle de versão e revisar alterações como configuração sensível à segurança.

## Destinos bloqueados recomendados

Use esta denylist como ponto de partida para qualquer proxy de encaminhamento, firewall ou política de saída.

A lógica de classificação no nível da aplicação do OpenClaw fica em `src/infra/net/ssrf.ts` e `src/shared/net/ip.ts`. Os hooks de paridade relevantes são `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e o tratamento de sentinelas IPv4 incorporadas para NAT64, 6to4, Teredo, ISATAP e formas IPv4-mapped. Esses arquivos são referências úteis ao manter uma política de proxy externa, mas o OpenClaw não exporta nem aplica automaticamente essas regras no seu proxy.

| Faixa ou host                                                                        | Por que bloquear                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Endereços não especificados e desta rede             |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC1918                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Endereços link-local e caminhos comuns de metadados de nuvem |
| `169.254.169.254`, `metadata.google.internal`                                        | Serviços de metadados de nuvem                       |
| `100.64.0.0/10`                                                                      | Espaço de endereços compartilhado de NAT de operadora |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Faixas de benchmark                                  |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Faixas de uso especial e documentação                |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                       |
| `fc00::/7`, `fec0::/10`                                                              | Faixas IPv6 locais/privadas                          |
| `100::/64`, `2001:20::/28`                                                           | Faixas IPv6 discard e ORCHIDv2                       |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefixos NAT64 com IPv4 incorporado                  |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo com IPv4 incorporado                   |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatível com IPv4 e IPv6 mapeado para IPv4    |

Se o seu provedor de nuvem ou plataforma de rede documentar hosts de metadados ou faixas reservadas adicionais, adicione-os também.

## Validação

Valide o proxy a partir do mesmo host, contêiner ou conta de serviço que executa o OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Por padrão, quando nenhum destino personalizado é fornecido, o comando verifica se `https://example.com/` funciona e inicia um canário temporário de loopback que o proxy não deve alcançar. A verificação negada padrão passa quando o proxy retorna uma resposta de negação não 2xx ou bloqueia o canário com uma falha de transporte; ela falha se uma resposta bem-sucedida chegar ao canário. Se nenhum proxy estiver habilitado e configurado, a validação relata um problema de configuração; use `--proxy-url` para uma pré-verificação avulsa antes de alterar a configuração. Use `--allowed-url` e `--denied-url` para testar expectativas específicas da implantação. Adicione `--apns-reachable` para também verificar se a entrega direta APNs HTTP/2 consegue abrir um túnel CONNECT pelo proxy e receber uma resposta de sandbox APNs; a sondagem usa um token de provedor intencionalmente inválido, portanto `403 InvalidProviderToken` é esperado e conta como alcançável. Destinos negados personalizados são fail-closed: qualquer resposta HTTP significa que o destino estava alcançável pelo proxy, e qualquer erro de transporte é relatado como inconclusivo porque o OpenClaw não consegue provar que o proxy bloqueou uma origem alcançável. Em caso de falha de validação, o comando sai com o código 1.

Use `--json` para automação. A saída JSON contém o resultado geral, a origem efetiva da configuração do proxy, quaisquer erros de configuração e cada verificação de destino. Credenciais da URL do proxy são redigidas na saída em texto e JSON:

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

A solicitação pública deve funcionar. As solicitações de loopback e metadados devem ser bloqueadas pelo proxy. Para `openclaw proxy validate`, o canário de loopback integrado consegue distinguir uma negação do proxy de uma origem alcançável. Verificações `--denied-url` personalizadas não têm esse canário, então trate tanto respostas HTTP quanto falhas de transporte ambíguas como falhas de validação, a menos que seu proxy exponha um sinal de negação específico da implantação que você possa verificar separadamente.

Então habilite o roteamento de proxy do OpenClaw:

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

- O proxy melhora a cobertura para clientes JavaScript HTTP e WebSocket locais ao processo, mas não é um sandbox de rede em nível de sistema operacional.
- O tráfego de plano de controle de loopback do Gateway usa, por padrão, bypass local direto por meio de `proxy.loopbackMode: "gateway-only"`. O OpenClaw implementa esse bypass registrando a autoridade de loopback ativa do Gateway no controlador `NO_PROXY` gerenciado de `global-agent`. Operadores podem definir `proxy.loopbackMode: "proxy"` para enviar o tráfego de loopback do Gateway pelo proxy gerenciado, ou `proxy.loopbackMode: "block"` para negar conexões de loopback do Gateway. Consulte [Modo de Loopback do Gateway](#gateway-loopback-mode) para a ressalva sobre proxy remoto.
- Sockets brutos `net`, `tls` e `http2`, addons nativos e processos filhos que não são do OpenClaw podem contornar o roteamento de proxy em nível de Node, a menos que herdem e respeitem variáveis de ambiente de proxy. CLIs filhas do OpenClaw bifurcadas herdam a URL do proxy gerenciado e o estado de `proxy.loopbackMode`.
- IRC é um canal TCP/TLS bruto fora do roteamento de proxy direto gerenciado pelo operador. Em implantações que exigem toda a saída por esse proxy direto, defina `channels.irc.enabled=false`, a menos que a saída direta de IRC seja explicitamente aprovada.
- O proxy local de depuração é uma ferramenta de diagnóstico, e seu encaminhamento upstream direto para solicitações de proxy e túneis CONNECT fica desabilitado por padrão enquanto o modo de proxy gerenciado está ativo; habilite o encaminhamento direto apenas para diagnósticos locais aprovados.
- WebUIs locais do usuário e servidores de modelos locais devem ser adicionados à lista de permissões na política de proxy do operador quando necessário; o OpenClaw não expõe um bypass geral de rede local para eles.
- O bypass de proxy do plano de controle do Gateway é intencionalmente limitado a `localhost` e URLs com IPs literais de loopback. Use `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` para conexões locais diretas do plano de controle do Gateway; outros nomes de host são roteados como tráfego comum baseado em nome de host.
- O OpenClaw não inspeciona, testa nem certifica sua política de proxy.
- Trate alterações na política de proxy como alterações operacionais sensíveis à segurança.
