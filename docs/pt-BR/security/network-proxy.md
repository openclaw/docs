---
read_when:
    - Você deseja defesa em profundidade contra ataques de SSRF e de religação de DNS
    - Configurando um proxy de encaminhamento externo para o tráfego de tempo de execução do OpenClaw
summary: Como rotear o tráfego HTTP e WebSocket do tempo de execução do OpenClaw por meio de um proxy de filtragem gerenciado pelo operador
title: Proxy de rede
x-i18n:
    generated_at: "2026-05-07T16:23:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 22895b7c5521927b7145f55dff9b777e701691f01a6421db0f5b1ff489734775
    source_path: security/network-proxy.md
    workflow: 16
---

O OpenClaw pode rotear o tráfego HTTP e WebSocket de runtime por meio de um proxy de encaminhamento gerenciado pelo operador. Essa é uma defesa opcional em profundidade para implantações que desejam controle central de egresso, proteção SSRF mais forte e melhor auditabilidade de rede.

O OpenClaw não distribui, baixa, inicia, configura nem certifica um proxy. Você executa a tecnologia de proxy adequada ao seu ambiente, e o OpenClaw roteia clientes HTTP e WebSocket normais locais ao processo por meio dela.

## Por que usar um proxy

Um proxy oferece aos operadores um único ponto de controle de rede para tráfego HTTP e WebSocket de saída. Isso pode ser útil mesmo fora do reforço contra SSRF:

- Política central: mantenha uma única política de egresso em vez de depender de cada ponto de chamada HTTP da aplicação para acertar as regras de rede.
- Verificações no momento da conexão: avalie o destino após a resolução de DNS e imediatamente antes de o proxy abrir a conexão upstream.
- Defesa contra DNS rebinding: reduza a lacuna entre uma verificação de DNS no nível da aplicação e a conexão de saída real.
- Cobertura JavaScript mais ampla: roteie clientes comuns como `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e similares pelo mesmo caminho.
- Auditabilidade: registre destinos permitidos e negados no limite de egresso.
- Controle operacional: imponha regras de destino, segmentação de rede, limites de taxa ou allowlists de saída sem reconstruir o OpenClaw.

O roteamento por proxy é uma proteção no nível do processo para egresso HTTP e WebSocket normal. Ele oferece aos operadores um caminho fail-closed para rotear clientes HTTP JavaScript compatíveis por meio do seu próprio proxy de filtragem, mas não é um sandbox de rede no nível do sistema operacional e não faz o OpenClaw certificar a política de destinos do proxy.

## Como o OpenClaw roteia tráfego

Quando `proxy.enabled=true` e uma URL de proxy está configurada, processos de runtime protegidos, como `openclaw gateway run`, `openclaw node run` e `openclaw agent --local`, roteiam o egresso HTTP e WebSocket normal por meio do proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

O contrato público é o comportamento de roteamento, não os hooks internos do Node usados para implementá-lo. Clientes WebSocket do plano de controle do OpenClaw Gateway usam um caminho direto estreito para tráfego RPC do Gateway em local loopback quando a URL do Gateway usa `localhost` ou um IP literal de loopback, como `127.0.0.1` ou `[::1]`. Esse caminho do plano de controle deve conseguir alcançar Gateways em loopback mesmo quando o proxy do operador bloqueia destinos de loopback. Requisições HTTP e WebSocket normais de runtime continuam usando o proxy configurado.

Internamente, o OpenClaw usa dois hooks de roteamento no nível do processo para esse recurso:

- O roteamento por dispatcher do Undici cobre `fetch`, clientes baseados em undici e transportes que fornecem seu próprio dispatcher undici.
- O roteamento por `global-agent` cobre chamadores do core do Node `node:http` e `node:https`, incluindo muitas bibliotecas construídas sobre `http.request`, `https.request`, `http.get` e `https.get`. O modo de proxy gerenciado força esse agente global para que agentes HTTP explícitos do Node não contornem acidentalmente o proxy do operador.

Alguns plugins possuem transportes personalizados que precisam de configuração explícita de proxy mesmo quando existe roteamento no nível do processo. Por exemplo, o transporte da Bot API do Telegram usa seu próprio dispatcher undici HTTP/1 e, portanto, respeita o ambiente de proxy do processo mais o fallback gerenciado `OPENCLAW_PROXY_URL` nesse caminho de transporte específico do proprietário.

A própria URL do proxy deve usar `http://`. Destinos HTTPS continuam sendo compatíveis por meio do proxy com HTTP `CONNECT`; isso significa apenas que o OpenClaw espera um listener de proxy de encaminhamento HTTP simples, como `http://127.0.0.1:3128`.

Enquanto o proxy está ativo, o OpenClaw limpa `no_proxy`, `NO_PROXY` e `GLOBAL_AGENT_NO_PROXY`. Essas listas de bypass são baseadas em destino, então deixar `localhost` ou `127.0.0.1` ali permitiria que alvos SSRF de alto risco pulassem o proxy de filtragem.

No encerramento, o OpenClaw restaura o ambiente de proxy anterior e redefine o estado de roteamento em cache do processo.

## Termos relacionados a proxy

- `proxy.enabled` / `proxy.proxyUrl`: roteamento de proxy de encaminhamento de saída para egresso de runtime do OpenClaw. Esta página documenta esse recurso.
- `gateway.auth.mode: "trusted-proxy"`: autenticação de proxy reverso de entrada com identidade para acesso ao Gateway. Consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy de depuração local e inspetor de captura para desenvolvimento e suporte. Consulte [openclaw proxy](/pt-BR/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy`: opção de adesão para `web_fetch` permitir que um proxy de ambiente HTTP(S) controlado pelo operador resolva DNS mantendo a política padrão estrita de pinning de DNS e hostname. Consulte [Web fetch](/pt-BR/tools/web-fetch#trusted-env-proxy).
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

### Modo de Loopback do Gateway

Clientes locais do plano de controle do Gateway geralmente se conectam a um WebSocket de loopback, como `ws://127.0.0.1:18789`. Use `proxy.loopbackMode` para escolher como esse tráfego se comporta enquanto o proxy gerenciado está ativo:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy, or block
```

- `gateway-only` (padrão): o OpenClaw registra a autoridade de loopback do Gateway no controlador `NO_PROXY` ativo do `global-agent` para que o tráfego WebSocket local do Gateway possa se conectar diretamente. Portas personalizadas de Gateway em loopback funcionam porque o host e a porta da URL ativa do Gateway são registrados.
- `proxy`: o OpenClaw não registra uma autoridade `NO_PROXY` de loopback do Gateway, então o tráfego local do Gateway é enviado pelo proxy gerenciado. Se o proxy for remoto, ele deve fornecer roteamento especial para o serviço de loopback do host do OpenClaw, como mapeá-lo para um hostname, IP ou túnel alcançável pelo proxy. Proxies remotos padrão resolvem `127.0.0.1` e `localhost` a partir do host do proxy, não do host do OpenClaw.
- `block`: o OpenClaw nega conexões de plano de controle do Gateway em loopback antes de abrir um socket.

Se `enabled=true`, mas nenhuma URL de proxy válida estiver configurada, comandos protegidos falham na inicialização em vez de voltar para acesso direto à rede.

Para serviços gerenciados do Gateway iniciados com `openclaw gateway start`, prefira armazenar a URL na configuração:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

O fallback de ambiente é melhor para execuções em primeiro plano. Se você usá-lo com um serviço instalado, coloque `OPENCLAW_PROXY_URL` no ambiente durável do serviço, como `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, e então reinstale o serviço para que launchd, systemd ou Tarefas Agendadas iniciem o gateway com esse valor.

Para comandos `openclaw --container ...`, o OpenClaw encaminha `OPENCLAW_PROXY_URL` para a CLI filha direcionada ao contêiner quando ele está definido. A URL deve ser alcançável de dentro do contêiner; `127.0.0.1` se refere ao próprio contêiner, não ao host. O OpenClaw rejeita URLs de proxy de loopback para comandos direcionados a contêiner, a menos que você substitua explicitamente essa verificação de segurança.

## Requisitos do Proxy

A política do proxy é o limite de segurança. O OpenClaw não consegue verificar se o proxy bloqueia os alvos corretos.

Configure o proxy para:

- Vincular-se apenas a loopback ou a uma interface privada confiável.
- Restringir o acesso para que apenas o processo, host, contêiner ou conta de serviço do OpenClaw possa usá-lo.
- Resolver destinos por conta própria e bloquear IPs de destino após a resolução de DNS.
- Aplicar a política no momento da conexão tanto para requisições HTTP simples quanto para túneis HTTPS `CONNECT`.
- Rejeitar bypasses baseados em destino para intervalos de loopback, privados, link-local, metadados, multicast, reservados ou de documentação.
- Evitar allowlists de hostname a menos que você confie totalmente no caminho de resolução de DNS.
- Registrar destino, decisão, status e motivo sem registrar corpos de requisição, cabeçalhos de autorização, cookies ou outros segredos.
- Manter a política de proxy sob controle de versão e revisar alterações como configuração sensível à segurança.

## Destinos bloqueados recomendados

Use esta denylist como ponto de partida para qualquer proxy de encaminhamento, firewall ou política de egresso.

A lógica de classificador no nível da aplicação do OpenClaw fica em `src/infra/net/ssrf.ts` e `src/shared/net/ip.ts`. Os hooks de paridade relevantes são `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e o tratamento de sentinela IPv4 incorporado para NAT64, 6to4, Teredo, ISATAP e formas mapeadas para IPv4. Esses arquivos são referências úteis ao manter uma política externa de proxy, mas o OpenClaw não exporta nem impõe automaticamente essas regras no seu proxy.

| Intervalo ou host                                                                     | Por que bloquear                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | Loopback IPv4                                       |
| `::1/128`                                                                            | Loopback IPv6                                       |
| `0.0.0.0/8`, `::/128`                                                                | Endereços não especificados e desta rede            |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC1918                              |
| `169.254.0.0/16`, `fe80::/10`                                                        | Endereços link-local e caminhos comuns de metadados em nuvem |
| `169.254.169.254`, `metadata.google.internal`                                        | Serviços de metadados em nuvem                      |
| `100.64.0.0/10`                                                                      | Espaço de endereços compartilhado de NAT de operadora |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Intervalos de benchmark                             |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Intervalos de uso especial e documentação           |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                      |
| `fc00::/7`, `fec0::/10`                                                              | Intervalos locais/privados IPv6                     |
| `100::/64`, `2001:20::/28`                                                           | Intervalos IPv6 discard e ORCHIDv2                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefixos NAT64 com IPv4 incorporado                 |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo com IPv4 incorporado                  |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatível com IPv4 e IPv6 mapeado para IPv4   |

Se seu provedor de nuvem ou plataforma de rede documentar hosts de metadados ou intervalos reservados adicionais, adicione-os também.

## Validação

Valide o proxy a partir do mesmo host, contêiner ou conta de serviço que executa o OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Por padrão, quando nenhum destino personalizado é fornecido, o comando verifica se `https://example.com/` é bem-sucedido e inicia um canário de loopback temporário que o proxy não deve alcançar. A verificação negada padrão passa quando o proxy retorna uma resposta de negação não 2xx ou bloqueia o canário com uma falha de transporte; ela falha se uma resposta bem-sucedida alcançar o canário. Se nenhum proxy estiver habilitado e configurado, a validação relata um problema de configuração; use `--proxy-url` para uma pré-verificação pontual antes de alterar a configuração. Use `--allowed-url` e `--denied-url` para testar expectativas específicas da implantação. Adicione `--apns-reachable` para também verificar se a entrega HTTP/2 direta de APNs consegue abrir um túnel CONNECT pelo proxy e receber uma resposta de APNs de sandbox; a sondagem usa um token de provedor intencionalmente inválido, portanto `403 InvalidProviderToken` é esperado e conta como alcançável. Destinos negados personalizados falham fechados: qualquer resposta HTTP significa que o destino era alcançável pelo proxy, e qualquer erro de transporte é relatado como inconclusivo porque o OpenClaw não consegue provar que o proxy bloqueou uma origem alcançável. Em caso de falha na validação, o comando sai com código 1.

Use `--json` para automação. A saída JSON contém o resultado geral, a origem efetiva da configuração do proxy, quaisquer erros de configuração e cada verificação de destino. Credenciais da URL do proxy são redigidas na saída de texto e JSON:

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

A solicitação pública deve ser bem-sucedida. As solicitações de loopback e de metadados devem ser bloqueadas pelo proxy. Para `openclaw proxy validate`, o canário de loopback integrado consegue distinguir uma negação do proxy de uma origem alcançável. Verificações `--denied-url` personalizadas não têm esse canário, então trate tanto respostas HTTP quanto falhas de transporte ambíguas como falhas de validação, a menos que seu proxy exponha um sinal de negação específico da implantação que você consiga verificar separadamente.

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

- O proxy melhora a cobertura para clientes HTTP e WebSocket JavaScript locais ao processo, mas não é uma sandbox de rede no nível do SO.
- O tráfego de plano de controle de loopback do Gateway usa por padrão um desvio local direto por meio de `proxy.loopbackMode: "gateway-only"`. O OpenClaw implementa esse desvio registrando a autoridade de loopback ativa do Gateway no controlador `NO_PROXY` gerenciado do `global-agent`. Operadores podem definir `proxy.loopbackMode: "proxy"` para enviar o tráfego de loopback do Gateway pelo proxy gerenciado, ou `proxy.loopbackMode: "block"` para negar conexões de loopback do Gateway. Consulte [Modo de Loopback do Gateway](#gateway-loopback-mode) para a ressalva sobre proxy remoto.
- Sockets brutos `net`, `tls` e `http2`, addons nativos e processos filhos que não são do OpenClaw podem ignorar o roteamento por proxy no nível do Node, a menos que herdem e respeitem variáveis de ambiente de proxy. CLIs filhas bifurcadas do OpenClaw herdam a URL do proxy gerenciado e o estado de `proxy.loopbackMode`.
- IRC é um canal TCP/TLS bruto fora do roteamento de proxy de encaminhamento gerenciado pelo operador. Em implantações que exigem toda saída por esse proxy de encaminhamento, defina `channels.irc.enabled=false`, a menos que a saída direta de IRC seja explicitamente aprovada.
- O proxy de depuração local é uma ferramenta de diagnóstico, e seu encaminhamento upstream direto para solicitações de proxy e túneis CONNECT fica desabilitado por padrão enquanto o modo de proxy gerenciado está ativo; habilite o encaminhamento direto apenas para diagnósticos locais aprovados.
- WebUIs locais do usuário e servidores de modelo locais devem ser incluídos na lista de permissões na política de proxy do operador quando necessário; o OpenClaw não expõe um desvio geral de rede local para eles.
- O desvio de proxy do plano de controle do Gateway é intencionalmente limitado a `localhost` e URLs de IP de loopback literais. Use `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` para conexões locais diretas do plano de controle do Gateway; outros nomes de host são roteados como tráfego comum baseado em nome de host.
- O OpenClaw não inspeciona, testa nem certifica sua política de proxy.
- Trate alterações na política de proxy como alterações operacionais sensíveis à segurança.

| Superfície                                                  | Status do proxy gerenciado                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, clientes WebSocket comuns | Roteado por hooks de proxy gerenciado quando configurado.                                               |
| HTTP/2 direto de APNs                                       | Roteado pelo auxiliar CONNECT gerenciado de APNs.                                                       |
| Loopback do plano de controle do Gateway                    | Direto apenas para a URL local de loopback configurada do Gateway.                                      |
| Encaminhamento upstream do proxy de depuração               | Desabilitado enquanto o modo de proxy gerenciado está ativo, a menos que seja explicitamente habilitado para diagnósticos locais. |
| IRC                                                         | TCP/TLS bruto; não passa por proxy no modo de proxy HTTP gerenciado. Desabilite, a menos que a saída direta de IRC seja aprovada. |
| Outras chamadas de cliente brutas `net`, `tls` ou `http2`   | Devem ser classificadas pela guarda de socket bruto antes de landing.                                   |
