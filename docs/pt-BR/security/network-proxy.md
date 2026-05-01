---
read_when:
    - Você quer defesa em profundidade contra ataques de SSRF e de religação de DNS
    - Configurando um proxy de encaminhamento externo para o tráfego de tempo de execução do OpenClaw
summary: Como rotear o tráfego HTTP e WebSocket de tempo de execução do OpenClaw por meio de um proxy de filtragem gerenciado pelo operador
title: Proxy de rede
x-i18n:
    generated_at: "2026-05-01T05:58:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9207d349e4410e38631ae7665be19b536e4a4128a4e80dd095e802804dfd66a3
    source_path: security/network-proxy.md
    workflow: 16
---

# Proxy de rede

O OpenClaw pode rotear tráfego HTTP e WebSocket de runtime por meio de um proxy direto gerenciado pelo operador. Essa é uma defesa opcional em profundidade para implantações que querem controle central de saída, proteção mais forte contra SSRF e melhor auditabilidade de rede.

O OpenClaw não inclui, baixa, inicia, configura nem certifica um proxy. Você executa a tecnologia de proxy adequada ao seu ambiente, e o OpenClaw roteia clientes HTTP e WebSocket normais, locais ao processo, por meio dele.

## Por que usar um proxy?

Um proxy dá aos operadores um ponto único de controle de rede para tráfego HTTP e WebSocket de saída. Isso pode ser útil mesmo fora do endurecimento contra SSRF:

- Política central: mantenha uma política de saída em vez de depender de cada ponto de chamada HTTP da aplicação para acertar as regras de rede.
- Verificações no momento da conexão: avalie o destino após a resolução DNS e imediatamente antes de o proxy abrir a conexão upstream.
- Defesa contra DNS rebinding: reduza a lacuna entre uma verificação DNS no nível da aplicação e a conexão de saída real.
- Cobertura JavaScript mais ampla: roteie clientes comuns como `fetch`, `node:http`, `node:https`, WebSocket, axios, got, node-fetch e similares pelo mesmo caminho.
- Auditabilidade: registre destinos permitidos e negados no limite de saída.
- Controle operacional: aplique regras de destino, segmentação de rede, limites de taxa ou listas de permissão de saída sem recompilar o OpenClaw.

O roteamento por proxy é uma proteção no nível do processo para saída HTTP e WebSocket normal. Ele dá aos operadores um caminho fail-closed para rotear clientes HTTP JavaScript compatíveis por seu próprio proxy de filtragem, mas não é um sandbox de rede no nível do sistema operacional e não faz o OpenClaw certificar a política de destino do proxy.

## Como o OpenClaw roteia tráfego

Quando `proxy.enabled=true` e uma URL de proxy está configurada, processos de runtime protegidos como `openclaw gateway run`, `openclaw node run` e `openclaw agent --local` roteiam a saída HTTP e WebSocket normal pelo proxy configurado:

```text
OpenClaw process
  fetch                  -> operator-managed filtering proxy -> public internet
  node:http and https    -> operator-managed filtering proxy -> public internet
  WebSocket clients      -> operator-managed filtering proxy -> public internet
```

O contrato público é o comportamento de roteamento, não os hooks internos do Node usados para implementá-lo. Clientes WebSocket do plano de controle do OpenClaw Gateway usam um caminho direto estreito para tráfego RPC do Gateway de local loopback quando a URL do Gateway usa `localhost` ou um IP literal de loopback, como `127.0.0.1` ou `[::1]`. Esse caminho do plano de controle precisa conseguir alcançar Gateways de loopback mesmo quando o proxy do operador bloqueia destinos de loopback. Requisições HTTP e WebSocket normais de runtime ainda usam o proxy configurado.

Internamente, o OpenClaw usa dois hooks de roteamento no nível do processo para este recurso:

- O roteamento do dispatcher do Undici cobre `fetch`, clientes baseados em undici e transportes que fornecem seu próprio dispatcher do undici.
- O roteamento do `global-agent` cobre chamadores do núcleo do Node `node:http` e `node:https`, incluindo muitas bibliotecas construídas sobre `http.request`, `https.request`, `http.get` e `https.get`. O modo de proxy gerenciado força esse agente global para que agentes HTTP explícitos do Node não contornem acidentalmente o proxy do operador.

Alguns plugins possuem transportes personalizados que precisam de configuração explícita de proxy mesmo quando existe roteamento no nível do processo. Por exemplo, o transporte da Bot API do Telegram usa seu próprio dispatcher HTTP/1 do undici e, portanto, respeita o ambiente de proxy do processo mais o fallback gerenciado `OPENCLAW_PROXY_URL` nesse caminho de transporte específico do proprietário.

A própria URL do proxy precisa usar `http://`. Destinos HTTPS ainda são compatíveis por meio do proxy com `CONNECT` HTTP; isso significa apenas que o OpenClaw espera um listener de proxy direto HTTP simples, como `http://127.0.0.1:3128`.

Enquanto o proxy está ativo, o OpenClaw limpa `no_proxy`, `NO_PROXY` e `GLOBAL_AGENT_NO_PROXY`. Essas listas de bypass são baseadas em destino, então deixar `localhost` ou `127.0.0.1` nelas permitiria que alvos SSRF de alto risco pulassem o proxy de filtragem.

No desligamento, o OpenClaw restaura o ambiente de proxy anterior e redefine o estado de roteamento de processo em cache.

## Termos relacionados a proxy

- `proxy.enabled` / `proxy.proxyUrl`: roteamento por proxy direto de saída para egresso de runtime do OpenClaw. Esta página documenta esse recurso.
- `gateway.auth.mode: "trusted-proxy"`: autenticação de proxy reverso de entrada, ciente de identidade, para acesso ao Gateway. Consulte [autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
- `openclaw proxy`: proxy local de depuração e inspetor de captura para desenvolvimento e suporte. Consulte [openclaw proxy](/pt-BR/cli/proxy).
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

Se `enabled=true`, mas nenhuma URL de proxy válida estiver configurada, os comandos protegidos falham na inicialização em vez de voltar para acesso direto à rede.

Para serviços de gateway gerenciados iniciados com `openclaw gateway start`, prefira armazenar a URL na configuração:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

O fallback de ambiente é melhor para execuções em primeiro plano. Se você usá-lo com um serviço instalado, coloque `OPENCLAW_PROXY_URL` no ambiente durável do serviço, como `$OPENCLAW_STATE_DIR/.env` ou `~/.openclaw/.env`, depois reinstale o serviço para que launchd, systemd ou Tarefas Agendadas iniciem o gateway com esse valor.

Para comandos `openclaw --container ...`, o OpenClaw encaminha `OPENCLAW_PROXY_URL` para a CLI filha direcionada ao contêiner quando ela está definida. A URL precisa ser alcançável de dentro do contêiner; `127.0.0.1` refere-se ao próprio contêiner, não ao host. O OpenClaw rejeita URLs de proxy de loopback para comandos direcionados ao contêiner, a menos que você substitua explicitamente essa verificação de segurança.

## Requisitos do proxy

A política do proxy é o limite de segurança. O OpenClaw não consegue verificar se o proxy bloqueia os alvos corretos.

Configure o proxy para:

- Vincular-se apenas ao loopback ou a uma interface privada confiável.
- Restringir o acesso para que apenas o processo, host, contêiner ou conta de serviço do OpenClaw possa usá-lo.
- Resolver os destinos por conta própria e bloquear IPs de destino após a resolução DNS.
- Aplicar a política no momento da conexão tanto para requisições HTTP simples quanto para túneis `CONNECT` HTTPS.
- Rejeitar bypasses baseados em destino para intervalos de loopback, privados, link-local, metadados, multicast, reservados ou de documentação.
- Evitar listas de permissão de nomes de host, a menos que você confie totalmente no caminho de resolução DNS.
- Registrar destino, decisão, status e motivo sem registrar corpos de requisição, cabeçalhos de autorização, cookies ou outros segredos.
- Manter a política do proxy sob controle de versão e revisar alterações como configuração sensível à segurança.

## Destinos bloqueados recomendados

Use esta denylist como ponto de partida para qualquer proxy direto, firewall ou política de saída.

A lógica de classificação no nível da aplicação do OpenClaw fica em `src/infra/net/ssrf.ts` e `src/shared/net/ip.ts`. Os hooks de paridade relevantes são `BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, `RFC2544_BENCHMARK_PREFIX` e o tratamento de sentinela IPv4 embutido para NAT64, 6to4, Teredo, ISATAP e formas mapeadas em IPv4. Esses arquivos são referências úteis ao manter uma política de proxy externa, mas o OpenClaw não exporta nem aplica automaticamente essas regras no seu proxy.

| Intervalo ou host                                                                    | Por que bloquear                                    |
| ------------------------------------------------------------------------------------ | --------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                  | loopback IPv4                                       |
| `::1/128`                                                                            | loopback IPv6                                       |
| `0.0.0.0/8`, `::/128`                                                                | Endereços não especificados e desta rede            |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                      | Redes privadas RFC1918                              |
| `169.254.0.0/16`, `fe80::/10`                                                        | Endereços link-local e caminhos comuns de metadados de nuvem |
| `169.254.169.254`, `metadata.google.internal`                                        | Serviços de metadados de nuvem                      |
| `100.64.0.0/10`                                                                      | Espaço de endereços compartilhado de NAT carrier-grade |
| `198.18.0.0/15`, `2001:2::/48`                                                       | Intervalos de benchmarking                          |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32` | Intervalos de uso especial e documentação           |
| `224.0.0.0/4`, `ff00::/8`                                                            | Multicast                                           |
| `240.0.0.0/4`                                                                        | IPv4 reservado                                      |
| `fc00::/7`, `fec0::/10`                                                              | Intervalos locais/privados IPv6                     |
| `100::/64`, `2001:20::/28`                                                           | Intervalos IPv6 discard e ORCHIDv2                  |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                     | Prefixos NAT64 com IPv4 embutido                    |
| `2002::/16`, `2001::/32`                                                             | 6to4 e Teredo com IPv4 embutido                     |
| `::/96`, `::ffff:0:0/96`                                                             | IPv6 compatível com IPv4 e IPv6 mapeado em IPv4     |

Se seu provedor de nuvem ou plataforma de rede documentar hosts de metadados ou intervalos reservados adicionais, adicione-os também.

## Validação

Valide o proxy a partir do mesmo host, contêiner ou conta de serviço que executa o OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Por padrão, quando nenhum destino personalizado é fornecido, o comando verifica se `https://example.com/` tem sucesso e inicia um canário temporário de loopback que o proxy não deve alcançar. A verificação negada padrão passa quando o proxy retorna uma resposta de negação não 2xx ou bloqueia o canário com uma falha de transporte; ela falha se uma resposta bem-sucedida alcançar o canário. Se nenhum proxy estiver habilitado e configurado, a validação relata um problema de configuração; use `--proxy-url` para um preflight único antes de alterar a configuração. Use `--allowed-url` e `--denied-url` para testar expectativas específicas da implantação. Destinos negados personalizados são fail-closed: qualquer resposta HTTP significa que o destino estava alcançável pelo proxy, e qualquer erro de transporte é relatado como inconclusivo porque o OpenClaw não consegue provar que o proxy bloqueou uma origem alcançável. Em falha de validação, o comando sai com código 1.

Use `--json` para automação. A saída JSON contém o resultado geral, a fonte efetiva da configuração de proxy, quaisquer erros de configuração e cada verificação de destino. Credenciais da URL do proxy são redigidas na saída de texto e JSON:

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

A requisição pública deve ter êxito. As requisições de loopback e metadados devem ser bloqueadas pelo proxy. Para `openclaw proxy validate`, o canário de loopback integrado consegue distinguir uma negação do proxy de uma origem alcançável. Verificações personalizadas com `--denied-url` não têm esse canário, então trate tanto respostas HTTP quanto falhas de transporte ambíguas como falhas de validação, a menos que seu proxy exponha um sinal de negação específico da implantação que você possa verificar separadamente.

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
- Soquetes brutos `net`, `tls` e `http2`, addons nativos e processos filhos podem contornar o roteamento de proxy no nível do Node, a menos que herdem e respeitem variáveis de ambiente de proxy.
- WebUIs locais do usuário e servidores de modelo locais devem ser incluídos na lista de permissões na política de proxy do operador quando necessário; o OpenClaw não expõe um bypass geral de rede local para eles.
- O bypass de proxy do plano de controle do Gateway é intencionalmente limitado a `localhost` e URLs de IP de loopback literais. Use `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789` para conexões diretas locais ao plano de controle do Gateway; outros nomes de host são roteados como tráfego comum baseado em nome de host.
- O OpenClaw não inspeciona, testa nem certifica sua política de proxy.
- Trate alterações na política de proxy como mudanças operacionais sensíveis à segurança.
