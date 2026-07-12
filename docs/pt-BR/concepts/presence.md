---
read_when:
    - Depuração do status em tempo real na página Dispositivos da interface de controle
    - Investigando linhas de instâncias duplicadas ou obsoletas
    - Alteração da conexão WS do Gateway ou dos sinalizadores de eventos do sistema
summary: Como as entradas de presença do OpenClaw são produzidas, mescladas e exibidas
title: Presença
x-i18n:
    generated_at: "2026-07-12T15:06:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4c0ef74eeaaa5ee00e43dfcfb25d7e3652fd6e7d0fac2d236fe3b9af7d193d1c
    source_path: concepts/presence.md
    workflow: 16
---

A "presença" do OpenClaw é uma visualização leve e de melhor esforço de:

- o próprio **Gateway**; e
- **clientes visíveis para o usuário conectados ao Gateway** (aplicativo para Mac, WebChat, nós etc.)

A presença exibe metadados de conexão em tempo real na página **Dispositivos** da UI de Controle
e na aba **Instâncias** do aplicativo para macOS.

Esta página aborda a lista de clientes do Gateway. Para detectar o Mac usado mais
recentemente e encaminhar alertas de nós para ele, consulte
[Presença do computador ativo](/nodes/presence).

## Campos de presença (o que é exibido)

As entradas de presença são objetos estruturados com campos como:

- `instanceId` (opcional, mas altamente recomendado): identidade estável do cliente (geralmente `connect.client.instanceId`)
- `host`: nome do host legível para humanos
- `ip`: endereço IP de melhor esforço
- `version`: string da versão do cliente
- `deviceFamily` / `modelIdentifier`: informações de hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: segundos desde a última entrada do usuário, se conhecido
- `reason`: string de formato livre fornecida pelo cliente; o próprio Gateway emite apenas `self`, `connect` e `disconnect`
- `deviceId`, `roles`, `scopes`: identidade do dispositivo e informações de função/escopo provenientes do handshake de conexão
- `ts`: carimbo de data/hora da última atualização (ms desde a época)

## Produtores (de onde vem a presença)

As entradas de presença são produzidas por várias fontes e **mescladas**.

### 1) Entrada do próprio Gateway

O Gateway sempre cria uma entrada "própria" na inicialização para que as UIs mostrem o host do Gateway
mesmo antes de qualquer cliente se conectar.

### 2) Conexão WebSocket

Todo cliente WS começa com uma solicitação `connect`. Após o handshake bem-sucedido, o
Gateway insere ou atualiza uma entrada de presença para essa conexão.

#### Por que conexões efêmeras do plano de controle não são exibidas

Comandos da CLI, clientes RPC de backend e sondas geralmente se conectam por pouco tempo. Para evitar
reter essa rotatividade durante todo o TTL de presença, os clientes nos modos `cli`, `backend`
ou `probe` **não** são transformados em entradas de presença. Clientes no modo de teste
continuam sendo rastreados porque as suítes de testes os usam como substitutos de clientes reais.

### 3) Sinalizadores `system-event`

Os clientes podem enviar sinalizadores periódicos mais detalhados por meio do método `system-event`. O aplicativo
para Mac usa esse recurso para informar o nome do host, o IP e `lastInputSeconds`.

### 4) Conexões de nós (função: node)

Quando um nó se conecta pelo WebSocket do Gateway com `role: node`, o Gateway
insere ou atualiza uma entrada de presença para esse nó (o mesmo fluxo dos demais clientes WS).

## Regras de mesclagem e desduplicação (por que `instanceId` é importante)

As entradas de presença são armazenadas em um único mapa na memória, com chaves sem diferenciação
entre maiúsculas e minúsculas, usando o primeiro valor disponível, nesta ordem: um ID de dispositivo pareado, `connect.client.instanceId`
ou, como último recurso, o ID específico da conexão.

Clientes efêmeros do plano de controle são totalmente excluídos do rastreamento (veja
acima), portanto seus IDs de conexão nunca se tornam chaves. Para todos os outros clientes, o
uso do ID da conexão como alternativa significa que um cliente que se reconecta sem um
`instanceId` estável aparece como uma linha **duplicada**.

## TTL e tamanho limitado

A presença é intencionalmente efêmera:

- **TTL:** entradas com mais de 5 minutos são removidas
- **Máximo de entradas:** 200 (as mais antigas são descartadas primeiro)

Isso mantém a lista atualizada e evita o crescimento ilimitado do uso de memória.

## Ressalva sobre acesso remoto/túnel (IPs de loopback)

Quando um cliente se conecta por um túnel SSH ou encaminhamento de porta local, o Gateway
pode identificar o endereço remoto como `127.0.0.1`. Para evitar registrar esse endereço de túnel
como o IP do cliente, o processamento da conexão omite completamente `ip` para
clientes detectados como locais (loopback), em vez de gravar o endereço de loopback
na entrada.

## Consumidores

### Página Dispositivos da UI de Controle

A página **Dispositivos** combina `system-presence` com registros persistentes de pareamento e de nós.
Ela fixa primeiro o sinalizador do próprio Gateway e usa IDs correspondentes de dispositivo ou
instância para obter metadados em tempo real de plataforma, versão, modelo e tempo desde a última entrada.

### Aba Instâncias do macOS

O aplicativo para macOS exibe a saída de `system-presence` e aplica um pequeno indicador
de status (Ativo/Ocioso/Desatualizado) com base no tempo decorrido desde a última atualização.

## Dicas de depuração

- Para ver a lista bruta, chame `system-presence` no Gateway.
- Se você vir duplicatas:
  - confirme que os clientes enviam um `client.instanceId` estável no handshake
  - confirme que os sinalizadores periódicos usam o mesmo `instanceId`
  - verifique se a entrada derivada da conexão não contém `instanceId` (duplicatas são esperadas)

## Relacionado

<CardGroup cols={2}>
  <Card title="Presença do computador ativo" href="/nodes/presence" icon="computer-mouse">
    Como a entrada física no Mac seleciona um nó ativo e encaminha alertas de conexão.
  </Card>
  <Card title="Indicadores de digitação" href="/pt-BR/concepts/typing-indicators" icon="ellipsis">
    Quando os indicadores de digitação são enviados e como ajustá-los.
  </Card>
  <Card title="Streaming e fragmentação" href="/pt-BR/concepts/streaming" icon="bars-staggered">
    Streaming de saída, fragmentação e formatação por canal.
  </Card>
  <Card title="Arquitetura do Gateway" href="/pt-BR/concepts/architecture" icon="diagram-project">
    Componentes do Gateway e o protocolo WebSocket que controla as atualizações de presença.
  </Card>
  <Card title="Protocolo do Gateway" href="/pt-BR/gateway/protocol" icon="plug">
    O protocolo de comunicação para `connect`, `system-event` e `system-presence`.
  </Card>
</CardGroup>
