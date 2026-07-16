---
read_when:
    - Depuração do status em tempo real na página Dispositivos da interface de controle
    - Investigação de linhas de instâncias duplicadas ou obsoletas
    - Alteração da conexão WS do Gateway ou dos sinalizadores de eventos do sistema
summary: Como as entradas de presença do OpenClaw são produzidas, mescladas e exibidas
title: Presença
x-i18n:
    generated_at: "2026-07-16T12:24:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b50291e26ddc06fac888847c9e94eba5f9351b1b8d06c55fd6bec16a38d0b6a5
    source_path: concepts/presence.md
    workflow: 16
---

A "presença" do OpenClaw é uma visão leve e de melhor esforço de:

- o próprio **Gateway** e
- os **clientes visíveis ao usuário conectados ao Gateway** (aplicativo para Mac, WebChat, Nodes etc.)

A presença exibe metadados de conexão em tempo real na página **Devices** da interface de controle
(em **Settings → Devices**) e na aba **Instances** do aplicativo para macOS.

Esta página aborda a lista de clientes do Gateway. Para detectar o Mac usado mais
recentemente e encaminhar alertas de Node para ele, consulte
[Presença do computador ativo](/pt-BR/nodes/presence).

## Campos de presença (o que é exibido)

As entradas de presença são objetos estruturados com campos como:

- `instanceId` (opcional, mas altamente recomendado): identidade estável do cliente (geralmente `connect.client.instanceId`)
- `host`: nome de host legível
- `ip`: endereço IP de melhor esforço
- `version`: string da versão do cliente
- `deviceFamily` / `modelIdentifier`: indicações de hardware
- `mode`: `ui`, `webchat`, `cli`, `backend`, `node`, `probe`, `test`
- `lastInputSeconds`: segundos desde a última entrada do usuário, se conhecido
- `reason`: string de formato livre fornecida pelo cliente; o próprio Gateway emite apenas `self`, `connect` e `disconnect`
- `deviceId`, `roles`, `scopes`: identidade do dispositivo e indicações de função/escopo do handshake de conexão
- `ts`: carimbo de data/hora da última atualização (ms desde a época)

## Produtores (origem da presença)

As entradas de presença são produzidas por várias fontes e **mescladas**.

### 1) Entrada do próprio Gateway

O Gateway sempre cria uma entrada para si mesmo na inicialização, para que as interfaces mostrem o host do Gateway
mesmo antes que qualquer cliente se conecte.

### 2) Conexão WebSocket

Todo cliente WS começa com uma solicitação `connect`. Após um handshake bem-sucedido, o
Gateway insere ou atualiza uma entrada de presença para essa conexão.

#### Por que as conexões efêmeras do plano de controle não são exibidas

Comandos da CLI, clientes RPC de back-end e sondas geralmente se conectam por pouco tempo. Para evitar
reter essa rotatividade durante todo o TTL de presença, os clientes nos modos `cli`, `backend`
ou `probe` **não** são transformados em entradas de presença. Os clientes em modo de teste
continuam sendo rastreados porque os conjuntos de testes os utilizam como substitutos de clientes reais.

### 3) Beacons de `system-event`

Os clientes podem enviar beacons periódicos mais detalhados pelo método `system-event`. O aplicativo para Mac
usa esse recurso para informar o nome do host, o IP e `lastInputSeconds`.

### 4) Conexões de Nodes (função: Node)

Quando um Node se conecta pelo WebSocket do Gateway com `role: node`, o Gateway
insere ou atualiza uma entrada de presença para esse Node (o mesmo fluxo dos demais clientes WS).

## Regras de mesclagem e desduplicação (por que `instanceId` é importante)

As entradas de presença são armazenadas em um único mapa na memória, com chaves que não diferenciam maiúsculas de minúsculas,
usando o primeiro valor disponível, nesta ordem: um ID de dispositivo emparelhado, `connect.client.instanceId`
ou, em último caso, o ID específico da conexão.

Os clientes efêmeros do plano de controle são totalmente excluídos do rastreamento (consulte
acima), portanto seus IDs de conexão nunca se tornam chaves. Para todos os outros clientes, o
uso do ID de conexão como alternativa significa que um cliente que se reconecta sem um
`instanceId` estável aparece como uma linha **duplicada**.

## TTL e tamanho limitado

A presença é intencionalmente efêmera:

- **TTL:** as entradas com mais de 5 minutos são removidas
- **Máximo de entradas:** 200 (as mais antigas são descartadas primeiro)

Isso mantém a lista atualizada e evita o crescimento ilimitado da memória.

## Ressalva sobre acesso remoto/túnel (IPs de loopback)

Quando um cliente se conecta por um túnel SSH ou encaminhamento de porta local, o Gateway
pode identificar o endereço remoto como `127.0.0.1`. Para evitar registrar esse endereço
de túnel como o IP do cliente, o processamento da conexão omite completamente `ip` para
clientes detectados como locais (loopback), em vez de gravar o endereço de loopback
na entrada.

## Consumidores

### Página Devices da interface de controle

A página **Devices** combina `system-presence` com registros persistentes de emparelhamento e de Nodes.
Ela fixa primeiro o beacon do próprio Gateway e usa IDs de dispositivo ou
instância correspondentes para obter metadados em tempo real de plataforma, versão, modelo e tempo desde a última entrada.

### Aba Instances do macOS

O aplicativo para macOS renderiza a saída de `system-presence` e aplica um pequeno indicador de status
(Active/Idle/Stale) com base no tempo decorrido desde a última atualização.

## Dicas de depuração

- Para ver a lista bruta, chame `system-presence` no Gateway.
- Se houver duplicatas:
  - confirme se os clientes enviam um `client.instanceId` estável no handshake
  - confirme se os beacons periódicos usam o mesmo `instanceId`
  - verifique se a entrada derivada da conexão não contém `instanceId` (nesse caso, duplicatas são esperadas)

## Relacionados

<CardGroup cols={2}>
  <Card title="Presença do computador ativo" href="/pt-BR/nodes/presence" icon="computer-mouse">
    Como a entrada física no Mac seleciona um Node ativo e encaminha alertas de conexão.
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
