---
read_when:
    - Você quer defesa em profundidade contra ataques de SSRF e de reassociação de DNS
    - Configurando um proxy direto externo para o tráfego de execução do OpenClaw
summary: Como rotear o tráfego HTTP e WebSocket do ambiente de execução do OpenClaw por meio de um proxy de filtragem gerenciado pelo operador
title: Proxy de rede
x-i18n:
    generated_at: "2026-04-30T10:09:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: c4e879f787571410acdda55dcdbb5fd77aef1d24045af5c9208cba51330a70ca
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy de rede

O OpenClaw pode rotear o tráfego HTTP e WebSocket de runtime por meio de um proxy de encaminhamento gerenciado pelo operador. Esta é uma defesa em profundidade opcional para implantações que querem controle central de egresso, proteção mais forte contra SSRF e melhor auditabilidade de rede.

O OpenClaw não fornece, baixa, inicia, configura nem certifica um proxy. Você executa a tecnologia de proxy adequada ao seu ambiente, e o OpenClaw roteia clientes HTTP e WebSocket normais, locais ao processo, por meio dele.

## Por que usar um proxy?

Um proxy dá aos operadores um ponto único de controle de rede para tráfego HTTP e WebSocket de saída. Isso pode ser útil até fora do reforço contra SSRF:

- Política central: mantenha uma política de egresso em vez de depender de cada ponto de chamada HTTP da aplicação para acertar as regras de rede.
- Verificações no momento da conexão: avalie o destino após a resolução de DNS e imediatamente antes de o proxy abrir a conexão upstream.
- Defesa contra DNS rebinding: reduza a lacuna entre uma verificação de DNS no nível da aplicação e a conexão de saída real.
- Cobertura JavaScript mais ampla: roteie clientes comuns como `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e similares pelo mesmo caminho.
- Auditabilidade: registre destinos permitidos e negados no limite de egresso.
- Controle operacional: aplique regras de destino, segmentação de rede, limites de taxa ou listas de permissão de saída sem recompilar o OpenClaw.

O roteamento por proxy é uma barreira de proteção em nível de processo para egresso HTTP e WebSocket normal. Ele dá aos operadores um caminho que falha fechado para rotear clientes HTTP JavaScript compatíveis por meio de seu próprio proxy de filtragem, mas não é um sandbox de rede em nível de sistema operacional e não faz o OpenClaw certificar a política de destino do proxy.

## Como o OpenClaw roteia tráfego

Quando `proxy.enabled=true` e uma URL de proxy está configurada, processos de runtime protegidos como `openclaw gateway run`, `openclaw node run` e `openclaw agent --local` roteiam o egresso HTTP e WebSocket normal pelo proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

O contrato público é o comportamento de roteamento, não os hooks internos do Node usados para implementá-lo. Clientes WebSocket do plano de controle do OpenClaw Gateway usam um caminho direto estreito para tráfego RPC local loopback do Gateway quando a URL do Gateway usa `localhost` ou um IP literal de loopback, como `127.0.0.1` ou `[::1]`. Esse caminho do plano de controle precisa conseguir alcançar Gateways em loopback mesmo quando o proxy do operador bloqueia destinos de loopback. Solicitações HTTP e WebSocket normais de runtime ainda usam o proxy configurado.

Internamente, o OpenClaw usa dois hooks de roteamento em nível de processo para este recurso:

- O roteamento por dispatcher do Undici cobre `fetch`, clientes baseados em undici e transportes que fornecem seu próprio dispatcher do undici.
- O roteamento por `global-agent` cobre chamadores do núcleo do Node `node:http` e `node:https`, incluindo muitas bibliotecas em camadas sobre `http.request`, `https.request`, `http.get` e `https.get`. O modo de proxy gerenciado força esse agente global para que agentes HTTP explícitos do Node não contornem acidentalmente o proxy do operador.

Alguns plugins possuem transportes personalizados que precisam de ligação explícita de proxy mesmo quando existe roteamento em nível de processo. Por exemplo, o transporte da Bot API do Telegram usa seu próprio dispatcher HTTP/1 do undici e, portanto, respeita o ambiente de proxy do processo mais o fallback gerenciado `OPENCLAW_PROXY_URL` nesse caminho de transporte específico do proprietário.

A própria URL do proxy deve usar `http://`. Destinos HTTPS ainda são compatíveis por meio do proxy com HTTP `CONNECT`; isso significa apenas que o OpenClaw espera um listener de proxy de encaminhamento HTTP simples, como `http://127.0.0.1:3128`.

Enquanto o proxy estiver ativo, o OpenClaw limpa `no_proxy`, `NO_PROXY` e `GLOBAL_AGENT_NO_PROXY`. Essas listas de desvio são baseadas em destino, portanto deixar `localhost` ou `127.0.0.1` nelas permitiria que alvos SSRF de alto risco ignorassem o proxy de filtragem.

No desligamento, o OpenClaw restaura o ambiente de proxy anterior e redefine o estado de roteamento de processo em cache.

## Termos de proxy relacionados

- `proxy.enabled` / `proxy.proxyUrl`: roteamento por proxy de encaminhamento de saída para egresso de runtime do OpenClaw. Esta página documenta esse recurso.
- `gateway.auth.mode: "trusted-proxy"`: autenticação de proxy reverso sensível à identidade de entrada para acesso ao Gateway. Consulte [autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy local de depuração e inspetor de captura para desenvolvimento e suporte. Consulte [openclaw proxy](/pt-BR/cli/proxy).
- Configurações de proxy específicas de canal ou provedor: substituições específicas do proprietário para um transporte específico. Prefira o proxy de rede gerenciado quando o objetivo for controle central de egresso em todo o runtime.

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

Se `enabled=true`, mas nenhuma URL de proxy válida estiver configurada, os comandos protegidos falham na inicialização em vez de recorrerem ao acesso direto à rede.

Para serviços de gateway gerenciados iniciados com `openclaw gateway start`, prefira armazenar a URL na configuração:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

O fallback de ambiente é melhor para execuções em primeiro plano. Se você usá-lo com um serviço instalado, coloque `OPENCLAW_PROXY_URL` no ambiente durável do serviço, como `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, então reinstale o serviço para que launchd, systemd ou Scheduled Tasks inicie o gateway com esse valor.

Para comandos `openclaw --container ...`, o OpenClaw encaminha `OPENCLAW_PROXY_URL` para o CLI filho direcionado ao contêiner quando ele está definido. A URL deve ser acessível de dentro do contêiner; `127.0.0.1` se refere ao próprio contêiner, não ao host. O OpenClaw rejeita URLs de proxy de loopback para comandos direcionados a contêiner, a menos que você substitua explicitamente essa verificação de segurança.

## Requisitos do proxy

A política do proxy é o limite de segurança. O OpenClaw não consegue verificar se o proxy bloqueia os alvos corretos.

Configure o proxy para:

- Vincular apenas ao loopback ou a uma interface privada confiável.
- Restringir o acesso para que apenas o processo, host, contêiner ou conta de serviço do OpenClaw possa usá-lo.
- Resolver destinos por conta própria e bloquear IPs de destino após a resolução de DNS.
- Aplicar política no momento da conexão tanto para solicitações HTTP simples quanto para túneis HTTPS `CONNECT`.
- Rejeitar desvios baseados em destino para intervalos de loopback, privados, link-local, metadados, multicast, reservados ou de documentação.
- Evitar listas de permissão de nomes de host, a menos que você confie totalmente no caminho de resolução de DNS.
- Registrar destino, decisão, status e motivo sem registrar corpos de solicitação, cabeçalhos de autorização, cookies ou outros segredos.
- Manter a política de proxy sob controle de versão e revisar alterações como configuração sensível à segurança.

## Destinos bloqueados recomendados

Use esta lista de negação como ponto de partida para qualquer proxy de encaminhamento, firewall ou política de egresso.

A lógica classificadora em nível de aplicação do OpenClaw fica em `src/infra/net/ssrf.ts` e `src/shared/net/ip.ts`. Os hooks de paridade relevantes são `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e o tratamento de sentinela IPv4 embutido para NAT64, 6to4, Teredo, ISATAP e formas IPv4-mapped. Esses arquivos são referências úteis ao manter uma política de proxy externa, mas o OpenClaw não exporta nem aplica automaticamente essas regras no seu proxy.

| Intervalo ou host                                                                     | Por que bloquear                                      |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                        |
| `::1/128`                                                                            | Loopback IPv6                                        |
| `0.0.0.0/8`, `::/128`                                                                | Endereços não especificados e desta rede             |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC1918                               |
| `169.254.0.0/16`, `fe80::/10`                                                        | Endereços link-local e caminhos comuns de metadados de nuvem |
| `169.254.169.254`, `metadata.google.internal`                                        | Serviços de metadados de nuvem                       |
| `100.64.0.0/10`                                                                      | Espaço de endereços compartilhado de NAT de grau de operadora |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Intervalos de benchmarking                           |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Intervalos de uso especial e documentação            |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                            |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                       |
| `fc00::/7`, `fec0::/10`                                                              | Intervalos IPv6 locais/privados                      |
| `100::/64`, `2001:20::/28`                                                           | Intervalos IPv6 discard e ORCHIDv2                   |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefixos NAT64 com IPv4 embutido                     |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo com IPv4 embutido                      |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatível com IPv4 e IPv6 IPv4-mapped          |

Se seu provedor de nuvem ou plataforma de rede documentar hosts de metadados ou intervalos reservados adicionais, adicione-os também.

## Validação

Valide o proxy a partir do mesmo host, contêiner ou conta de serviço que executa o OpenClaw:

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

A solicitação pública deve ter sucesso. As solicitações de loopback e metadados devem falhar no proxy.

Em seguida, habilite o roteamento por proxy do OpenClaw:

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
- Sockets brutos `net`, `tls` e `http2`, addons nativos e processos filhos podem contornar o roteamento por proxy no nível do Node, a menos que herdem e respeitem variáveis de ambiente de proxy.
- WebUIs locais do usuário e servidores de modelo locais devem ser incluídos na lista de permissão da política de proxy do operador quando necessário; o OpenClaw não expõe um desvio geral de rede local para eles.
- O desvio de proxy do plano de controle do Gateway é intencionalmente limitado a `localhost` e URLs de IP literal de loopback. Use `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` para conexões locais diretas do plano de controle do Gateway; outros nomes de host são roteados como tráfego comum baseado em nome de host.
- O OpenClaw não inspeciona, testa nem certifica sua política de proxy.
- Trate alterações de política de proxy como mudanças operacionais sensíveis à segurança.
