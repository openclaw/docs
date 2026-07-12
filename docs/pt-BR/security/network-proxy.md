---
read_when:
    - Você quer defesa em profundidade contra ataques de SSRF e de religação de DNS
    - Configurando um proxy de encaminhamento externo para o tráfego de runtime do OpenClaw
summary: Como rotear o tráfego HTTP e WebSocket do ambiente de execução do OpenClaw por meio de um proxy de filtragem gerenciado pelo operador
title: Proxy de rede
x-i18n:
    generated_at: "2026-07-12T00:24:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd82684a17a79242891eca69c549c0bfcdd5bde40fa4e791dda7f2b62c473c89
    source_path: security/network-proxy.md
    workflow: 16
---

O OpenClaw pode encaminhar o tráfego HTTP e WebSocket em tempo de execução por meio de um proxy de encaminhamento gerenciado pelo operador. Esta é uma defesa em profundidade opcional: controle centralizado de saída, proteção mais robusta contra SSRF e auditabilidade dos destinos no limite da rede. Como o proxy avalia o destino no momento da conexão, após a resolução de DNS e imediatamente antes de abrir a conexão upstream, ele também reduz a janela da qual um ataque de religação de DNS depende entre uma verificação anterior de DNS no nível da aplicação e a conexão de saída efetiva. Uma única política de proxy também oferece aos operadores um ponto central para aplicar regras de destino, segmentação de rede, limites de taxa ou listas de destinos de saída permitidos sem recompilar o OpenClaw.

O OpenClaw não inclui, baixa, inicia, configura nem certifica um proxy. Você executa a tecnologia de proxy adequada ao seu ambiente; o OpenClaw encaminha seus próprios clientes HTTP e WebSocket por meio dela.

## Configuração

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
```

Você também pode definir a URL por meio do ambiente enquanto `proxy.enabled: true` permanece na configuração:

```bash
OPENCLAW_PROXY_URL=http://127.0.0.1:3128 openclaw gateway run
```

`proxy.proxyUrl` tem precedência sobre `OPENCLAW_PROXY_URL`. Se `proxy.enabled` for `true`, mas nenhuma URL válida for resolvida, os comandos protegidos falharão na inicialização em vez de recorrer ao acesso direto à rede.

| Chave                | Tipo                                 | Padrão         | Observações                                                                                                                                             |
| -------------------- | ------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.enabled`      | boolean                              | não definido   | Deve ser `true` para ativar o encaminhamento.                                                                                                           |
| `proxy.proxyUrl`     | string                               | não definido   | URL do proxy de encaminhamento `http://` ou `https://`. Credenciais incorporadas à URL são tratadas como dados confidenciais e ocultadas de snapshots/logs. |
| `proxy.tls.caFile`   | string                               | não definido   | Pacote de CAs para verificar um endpoint de proxy `https://` assinado por uma CA privada.                                                               |
| `proxy.loopbackMode` | `gateway-only` \| `proxy` \| `block` | `gateway-only` | Controla o comportamento de desvio de loopback; veja abaixo.                                                                                            |

Para serviços gerenciados do Gateway, armazene a URL na configuração para que ela persista após uma reinstalação, em vez de depender de uma variável de ambiente no processo em primeiro plano:

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl http://127.0.0.1:3128
openclaw gateway install --force
openclaw gateway start
```

O fallback da variável de ambiente `OPENCLAW_PROXY_URL` é mais adequado para execuções em primeiro plano. Para usá-lo com um serviço instalado, coloque-o no ambiente persistente do serviço (`$OPENCLAW_STATE_DIR/.env`, por padrão `~/.openclaw/.env`) e reinstale o serviço para que launchd/systemd/Scheduled Tasks o carregue.

### Endpoint de proxy HTTPS com uma CA privada

```yaml
proxy:
  enabled: true
  proxyUrl: https://proxy.corp.example:8443
  tls:
    caFile: /etc/openclaw/proxy-ca.pem
```

`proxy.tls.caFile` verifica o certificado TLS do próprio endpoint de proxy. Ele não é uma configuração de confiança MITM para destinos, um certificado de cliente nem um substituto para a política de destinos do proxy. Use `NODE_EXTRA_CA_CERTS` somente quando todo o processo Node precisar confiar em uma CA adicional desde a inicialização (por exemplo, um sistema corporativo de inspeção TLS que assina novamente todos os certificados de destinos HTTPS) — essa variável é global para o processo e deve ser definida antes de o Node ser iniciado, portanto o OpenClaw não pode aplicá-la durante a execução como faz com `proxy.tls.caFile`. Prefira `proxy.tls.caFile` para confiar no endpoint de proxy HTTPS: seu escopo é limitado ao encaminhamento por proxy gerenciado, em vez de abranger todo o processo.

```bash
openclaw config set proxy.enabled true
openclaw config set proxy.proxyUrl https://proxy.corp.example:8443
openclaw config set proxy.tls.caFile /etc/openclaw/proxy-ca.pem
openclaw gateway run
```

## Como o encaminhamento funciona

Com `proxy.enabled: true` e uma URL válida, os processos protegidos em tempo de execução (`openclaw gateway run`, `openclaw node run`, `openclaw agent --local`) encaminham a saída HTTP e WebSocket normal por meio do proxy:

```text
Processo do OpenClaw
  fetch, node:http, node:https, clientes WebSocket  -> proxy do operador -> destino
```

Internamente, o OpenClaw instala o [Proxyline](https://github.com/openclaw/proxyline) como o mecanismo de encaminhamento no nível do processo. Ele abrange `fetch`, clientes baseados em undici, `node:http`/`node:https`, clientes WebSocket comuns e túneis `CONNECT` criados por auxiliares, além de substituir agentes HTTP do Node fornecidos pelos chamadores para que agentes explícitos (incluindo `axios`, `got`, `node-fetch` e clientes semelhantes baseados em agentes do Node) não possam ignorar o proxy silenciosamente.

O esquema da URL do proxy descreve o salto do OpenClaw até o proxy, não até o destino final:

- `http://proxy.example:3128` — TCP sem criptografia até o proxy; o OpenClaw envia solicitações de proxy HTTP, incluindo `CONNECT` para destinos HTTPS.
- `https://proxy.example:8443` — o OpenClaw abre uma conexão TLS com o próprio proxy (verificando o certificado dele) e envia solicitações de proxy HTTP dentro dessa sessão.

O TLS do destino é independente do TLS do endpoint de proxy: para um destino HTTPS, o OpenClaw sempre solicita ao proxy um túnel `CONNECT` e inicia o TLS do destino por meio desse túnel.

Enquanto o proxy está ativo, o OpenClaw limpa `no_proxy`/`NO_PROXY`. Essas listas de desvio são baseadas no destino; manter `localhost` ou `127.0.0.1` nelas permitiria que alvos de SSRF ignorassem completamente o proxy. No encerramento, o OpenClaw restaura o ambiente de proxy anterior e redefine o estado de encaminhamento em cache.

Alguns plugins têm um transporte personalizado que precisa de sua própria integração com o proxy, mesmo quando o encaminhamento no nível do processo está ativo. O cliente da Bot API do Telegram usa seu próprio dispatcher HTTP/1 do undici e, separadamente, respeita as variáveis de ambiente de proxy do processo, além do fallback `OPENCLAW_PROXY_URL`.

### Modo de loopback do Gateway

Os clientes locais do plano de controle do Gateway normalmente se conectam a um WebSocket de loopback, como `ws://127.0.0.1:18789`. `proxy.loopbackMode` controla se esse tráfego ignora o proxy gerenciado:

```yaml
proxy:
  enabled: true
  proxyUrl: http://127.0.0.1:3128
  loopbackMode: gateway-only # gateway-only, proxy ou block
```

| Modo                     | Comportamento                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `gateway-only` (padrão)  | O OpenClaw registra a autoridade de loopback do Gateway ativo como uma exceção de conexão direta, para que o tráfego WebSocket local do Gateway se conecte sem o proxy. Portas de loopback personalizadas funcionam porque a exceção aponta para o host e a porta configurados exatos. O plugin de navegador incluído registra o mesmo tipo de exceção para as URLs locais exatas de prontidão do CDP e do WebSocket do DevTools dos navegadores gerenciados iniciados pelo OpenClaw; o provedor incluído de embeddings de memória do Ollama tem um caminho direto protegido mais restrito para sua origem de embeddings de loopback local ao host configurada exatamente. |
| `proxy`                  | Nenhuma exceção de loopback é registrada; o tráfego de loopback do Gateway e do Ollama passa pelo proxy. Um proxy remoto deve conseguir encaminhar o tráfego de volta para o serviço de loopback do host do OpenClaw (por exemplo, por meio de um nome de host, IP ou túnel acessível) — um proxy remoto padrão resolve `127.0.0.1`/`localhost` em relação a si próprio, não em relação ao host do OpenClaw.                                                                                                                                                                                                                                                           |
| `block`                  | O OpenClaw nega conexões do plano de controle de loopback do Gateway e conexões protegidas de embeddings de loopback do Ollama antes de abrir um socket.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

O desvio do plano de controle do Gateway é limitado a `localhost` e URLs com IPs de loopback literais — use `ws://127.0.0.1:18789`, `ws://[::1]:18789` ou `ws://localhost:18789`. Outros nomes de host são encaminhados como tráfego comum.

### Contêineres

Para comandos `openclaw --container ...`, o OpenClaw encaminha `OPENCLAW_PROXY_URL` para a CLI filha direcionada ao contêiner quando a variável está definida. A URL deve ser acessível de dentro do contêiner — nesse contexto, `127.0.0.1` se refere ao próprio contêiner, não ao host. O OpenClaw rejeita URLs de proxy de loopback para comandos direcionados a contêineres, a menos que você defina `OPENCLAW_CONTAINER_ALLOW_LOOPBACK_PROXY_URL=1` para substituir explicitamente essa verificação.

## Termos relacionados a proxy

- `proxy.enabled` / `proxy.proxyUrl` — encaminhamento por proxy de saída para o tráfego de saída em tempo de execução. Esta página.
- `gateway.auth.mode: "trusted-proxy"` — autenticação por proxy reverso com reconhecimento de identidade para acesso ao Gateway. Consulte [Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth).
- `openclaw proxy` — proxy local de depuração e inspetor de capturas para desenvolvimento e suporte. Consulte [openclaw proxy](/pt-BR/cli/proxy).
- `tools.web.fetch.useTrustedEnvProxy` — opção para permitir que `web_fetch` use um proxy HTTP(S) de ambiente controlado pelo operador para resolver o DNS, mantendo por padrão a fixação estrita de DNS e a política de nomes de host. Consulte [Busca na Web](/pt-BR/tools/web-fetch#trusted-env-proxy).
- Configurações de proxy específicas de canal ou provedor — substituições específicas do proprietário para um único transporte. Prefira o proxy de rede gerenciado para controlar centralmente o tráfego de saída em todo o ambiente de execução.

## Validação do proxy

A política de destinos do proxy é o limite de segurança efetivo; o OpenClaw não pode verificar se o seu proxy bloqueia os alvos corretos. Configure-o para:

- Escutar somente no loopback ou em uma interface privada confiável, acessível apenas pelo processo/host/contêiner/conta de serviço do OpenClaw.
- Resolver os destinos por conta própria e bloqueá-los por IP após a resolução de DNS, no momento da conexão, tanto para HTTP sem criptografia quanto para túneis HTTPS `CONNECT`.
- Rejeitar desvios baseados em destino para intervalos de loopback, privados, link-local, de metadados, multicast, reservados e de documentação.
- Evitar listas de nomes de host permitidos, a menos que você confie totalmente no caminho de resolução de DNS.
- Registrar destino, decisão, status e motivo — nunca corpos de solicitações, cabeçalhos de autorização, cookies ou outros segredos.
- Manter a política sob controle de versão e revisar as alterações como sensíveis à segurança.

Valide usando o mesmo host/contêiner/conta de serviço que executa o OpenClaw:

```bash
openclaw proxy validate --proxy-url http://127.0.0.1:3128
```

Com um endpoint de proxy HTTPS que usa uma CA privada:

```bash
openclaw proxy validate --proxy-url https://proxy.corp.example:8443 --proxy-ca-file /etc/openclaw/proxy-ca.pem
```

| Opção                    | Finalidade                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| `--proxy-url <url>`      | Valida esta URL em vez de resolver a configuração/variáveis de ambiente.                        |
| `--proxy-ca-file <path>` | Pacote de certificados de AC para um endpoint de proxy HTTPS.                                   |
| `--allowed-url <url>`    | Destino que deve ser acessado com êxito (pode ser repetido).                                    |
| `--denied-url <url>`     | Destino que deve ser bloqueado (pode ser repetido).                                             |
| `--apns-reachable`       | Também verifica se o proxy pode criar um túnel para uma sondagem HTTP/2 direta das APNs sandbox. |
| `--apns-authority <url>` | Substitui a autoridade das APNs sondada com `--apns-reachable`.                                 |
| `--timeout-ms <ms>`      | Tempo limite por solicitação.                                                                   |
| `--json`                 | Saída legível por máquina.                                                                      |

Se `proxy.enabled` não for `true` e nenhuma `--proxy-url` for fornecida, o comando relatará um problema de configuração em vez de realizar a validação; passe `--proxy-url` para uma verificação preliminar pontual antes de alterar a configuração.

Sem `--allowed-url`/`--denied-url`, as verificações padrão são: `https://example.com/` deve ser acessada com êxito, e um servidor sentinela temporário em local loopback, que o proxy não deve conseguir acessar, deve ser bloqueado. A verificação de local loopback é aprovada quando ocorre uma falha de transporte ou uma resposta que não seja 2xx e não contenha o token exclusivo da execução do servidor sentinela; ela falha quando ocorre uma resposta 2xx sem o token (um êxito inesperado proveniente de algo diferente do servidor sentinela) e, principalmente, quando qualquer resposta contém o token correspondente, pois isso comprova que o proxy realmente encaminhou um destino de local loopback que deveria ter negado. Destinos `--denied-url` personalizados não têm esse token sentinela, portanto adotam falha segura: qualquer resposta HTTP conta como acessível (falha), e um erro de transporte é relatado como inconclusivo, em vez de comprovadamente bloqueado, porque o OpenClaw não consegue confirmar se o proxy negou uma origem acessível ou se algo diferente deu errado. `--apns-reachable` envia um token de provedor intencionalmente inválido; portanto, uma resposta `403 InvalidProviderToken` serve como comprovação de que o túnel alcançou a Apple. O comando encerra com código `1` em qualquer falha de validação; as credenciais da URL do proxy são ocultadas tanto na saída de texto quanto na saída JSON.

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
    { "kind": "allowed", "url": "https://example.com/", "ok": true, "status": 200 },
    { "kind": "apns", "url": "https://api.sandbox.push.apple.com", "ok": true, "status": 403 }
  ]
}
```

Verificação manual com `curl` (a solicitação pública deve ser concluída com êxito; as solicitações de local loopback e de metadados devem ser bloqueadas pelo próprio proxy — o `curl` sozinho não consegue distinguir uma negação do proxy de uma origem inacessível como o servidor sentinela integrado do `openclaw proxy validate` consegue):

```bash
curl -x http://127.0.0.1:3128 https://example.com/
curl -x http://127.0.0.1:3128 http://127.0.0.1/
curl -x http://127.0.0.1:3128 http://169.254.169.254/
```

## Destinos cujo bloqueio é recomendado

Lista inicial de bloqueios para qualquer proxy de encaminhamento, firewall ou política de saída. O classificador de SSRF do próprio OpenClaw está em `src/infra/net/ssrf.ts` e `packages/net-policy/src/ip.ts` (`BLOCKED_HOSTNAMES`, `BLOCKED_IPV4_SPECIAL_USE_RANGES`, `BLOCKED_IPV6_SPECIAL_USE_RANGES`, o prefixo de referência da RFC 2544 e o tratamento de IPv4 incorporado para formatos NAT64/6to4/Teredo/ISATAP/mapeados para IPv4) — são referências úteis, mas o OpenClaw não exporta nem aplica essas regras no seu proxy externo.

| Intervalo ou host                                                                     | Motivo do bloqueio                                               |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `127.0.0.0/8`, `localhost`, `localhost.localdomain`                                   | local loopback IPv4                                              |
| `::1/128`                                                                             | local loopback IPv6                                              |
| `0.0.0.0/8`, `::/128`                                                                 | Endereços não especificados/desta rede                            |
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`                                       | Redes privadas da RFC 1918                                       |
| `169.254.0.0/16`, `fe80::/10`                                                         | Link-local, incluindo caminhos comuns de metadados de nuvem       |
| `169.254.169.254`, `metadata.google.internal`                                         | Serviços de metadados de nuvem                                   |
| `100.64.0.0/10`                                                                       | Espaço de endereços compartilhado de NAT de operadora             |
| `198.18.0.0/15`, `2001:2::/48`                                                        | Intervalos para testes de desempenho                              |
| `192.0.0.0/24`, `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24`, `2001:db8::/32`  | Intervalos de uso especial e documentação                         |
| `224.0.0.0/4`, `ff00::/8`                                                             | Multicast                                                        |
| `240.0.0.0/4`                                                                         | IPv4 reservado                                                   |
| `fc00::/7`, `fec0::/10`                                                               | Intervalos IPv6 locais/privados                                   |
| `100::/64`, `2001:20::/28`                                                            | Intervalos IPv6 de descarte e ORCHIDv2                             |
| `64:ff9b::/96`, `64:ff9b:1::/48`                                                      | Prefixos NAT64 com IPv4 incorporado                               |
| `2002::/16`, `2001::/32`                                                              | 6to4 e Teredo com IPv4 incorporado                                |
| `::/96`, `::ffff:0:0/96`                                                              | IPv6 compatível com IPv4 e IPv6 mapeado para IPv4                 |

Adicione quaisquer outros hosts de metadados ou intervalos reservados documentados pelo seu provedor de nuvem ou plataforma de rede.

## Limites

| Superfície                                                   | Status do proxy gerenciado                                                                                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch`, `node:http`, `node:https`, clientes WebSocket comuns | Encaminhados pelos hooks do proxy gerenciado quando configurado.                                                                                                              |
| HTTP/2 direto das APNs                                       | Encaminhado pelo auxiliar `CONNECT` gerenciado das APNs.                                                                                                                      |
| local loopback do plano de controle do Gateway               | Direto somente para a URL local de local loopback exata do Gateway configurado.                                                                                               |
| Encaminhamento upstream do proxy de depuração                | Desativado enquanto o modo de proxy gerenciado estiver ativo, salvo quando explicitamente ativado para diagnósticos locais.                                                    |
| IRC                                                          | TCP/TLS bruto; não passa pelo modo de proxy HTTP gerenciado. Defina `channels.irc.enabled: false` se sua implantação exigir que toda saída passe pelo proxy de encaminhamento. |
| Outras chamadas de cliente `net`, `tls` ou `http2` brutas    | Devem ser classificadas pela proteção de soquetes brutos antes da integração.                                                                                                 |

- Essa é uma cobertura no nível do processo para clientes HTTP/WebSocket JavaScript, não uma sandbox de rede no nível do sistema operacional.
- Soquetes `net`, `tls` e `http2` brutos, complementos nativos e processos filhos que não sejam do OpenClaw podem contornar o roteamento no nível do Node, a menos que herdem e respeitem as variáveis de ambiente do proxy. CLIs filhas do OpenClaw criadas por fork herdam a URL do proxy gerenciado e o estado de `proxy.loopbackMode`.
- WebUIs locais do usuário e servidores de modelos locais não são abrangidos por uma exceção geral para a rede local — inclua-os na lista de permissões da política de proxy do operador, se necessário. A exceção é o caminho direto protegido do provedor integrado de embeddings de memória do Ollama, limitado à origem exata de local loopback do host obtida de seu `baseUrl` configurado; hosts do Ollama na LAN, tailnet, rede privada e internet pública ainda usam o proxy gerenciado.
- O encaminhamento upstream direto do proxy de depuração local (para solicitações de proxy e túneis `CONNECT`) fica desativado por padrão enquanto o modo de proxy gerenciado está ativo; ative-o somente para diagnósticos locais aprovados.
- O OpenClaw não inspeciona, testa nem certifica sua política de proxy. Trate alterações na política de proxy como mudanças operacionais sensíveis à segurança.
