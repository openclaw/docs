---
read_when:
    - Configurando o Mattermost
    - Depuração do roteamento do Mattermost
sidebarTitle: Mattermost
summary: Configuração do bot do Mattermost e do OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-11T23:45:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

Status: Plugin disponível para download (token de bot + eventos WebSocket). Há suporte a canais, canais privados, DMs em grupo e DMs. O Mattermost é uma plataforma auto-hospedável de mensagens para equipes ([mattermost.com](https://mattermost.com)).

## Instalação

<Tabs>
  <Tab title="Registro npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Checkout local">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

<Steps>
  <Step title="Verifique se o Plugin está disponível">
    Instale `@openclaw/mattermost` com o comando acima e reinicie o Gateway caso ele já esteja em execução.
  </Step>
  <Step title="Crie um bot do Mattermost">
    Crie uma conta de bot no Mattermost, copie o **token do bot** e adicione o bot às equipes e aos canais que ele deve ler.
  </Step>
  <Step title="Copie a URL base">
    Copie a **URL base** do Mattermost (por exemplo, `https://chat.example.com`). Um `/api/v4` no final é removido automaticamente.
  </Step>
  <Step title="Configure o OpenClaw e inicie o Gateway">
    Configuração mínima:

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

    Alternativa não interativa:

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Mattermost auto-hospedado em um endereço privado/de LAN/da tailnet: as solicitações de saída para a API do Mattermost passam por uma proteção contra SSRF que bloqueia IPs privados e internos por padrão. Habilite explicitamente com `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (por conta: `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Comandos de barra nativos

Os comandos de barra nativos são opcionais. Quando habilitados, o OpenClaw registra comandos de barra `oc_*` em todas as equipes das quais o bot é membro e recebe POSTs de callback no servidor HTTP do Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use quando o Mattermost não puder acessar o Gateway diretamente (proxy reverso/URL pública).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Comandos registrados: `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Com `nativeSkills: true`, os comandos de Skills também são registrados como `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Observações sobre o comportamento">
    - O padrão de `native` e `nativeSkills` é `"auto"`, que resulta em desabilitado para o Mattermost. Defina-os explicitamente como `true`.
    - O padrão de `callbackPath` é `/api/channels/mattermost/command`.
    - Se `callbackUrl` for omitida, o OpenClaw deriva `http://<gateway.customBindHost ou localhost>:<gateway.port, padrão 18789><callbackPath>`. Hosts de associação curinga (`0.0.0.0`, `::`) usam `localhost` como alternativa.
    - Em configurações com várias contas, `commands` pode ser definido no nível superior ou em `channels.mattermost.accounts.<id>.commands` (os valores da conta substituem os campos do nível superior).
    - Comandos de barra existentes com o mesmo gatilho, criados por outras integrações, permanecem inalterados (o registro os ignora); os comandos criados pelo bot são atualizados ou recriados quando a URL de callback diverge.
    - Os callbacks de comandos são validados com os tokens específicos de cada comando retornados pelo Mattermost quando o OpenClaw registra os comandos `oc_*`.
    - O OpenClaw atualiza o registro atual de comandos do Mattermost antes de aceitar cada callback; assim, tokens obsoletos de comandos de barra excluídos ou gerados novamente deixam de ser aceitos sem reiniciar o Gateway.
    - A validação do callback falha de modo seguro se a API do Mattermost não puder confirmar que o comando ainda é atual; as validações com falha são armazenadas brevemente em cache, consultas simultâneas são agrupadas e o início de novas consultas tem limite de frequência por comando para restringir a pressão de repetição.
    - Os callbacks de barra falham de modo seguro quando o registro falha, a inicialização é parcial ou o token do callback não corresponde ao token registrado do comando resolvido (um token válido para um comando não pode alcançar a validação upstream de outro comando).
    - Os callbacks aceitos são confirmados com uma resposta efêmera "Processando..."; a resposta real chega como uma mensagem normal.

  </Accordion>
  <Accordion title="Requisito de acessibilidade">
    O endpoint de callback deve estar acessível a partir do servidor do Mattermost.

    - Não defina `callbackUrl` como `localhost`, a menos que o Mattermost seja executado no mesmo host/namespace de rede que o OpenClaw.
    - Não defina `callbackUrl` como a URL base do Mattermost, a menos que essa URL use um proxy reverso para encaminhar `/api/channels/mattermost/command` ao OpenClaw.
    - Uma verificação rápida é `curl https://<gateway-host>/api/channels/mattermost/command`; uma solicitação GET deve retornar `405 Method Not Allowed` do OpenClaw, não `404`.

  </Accordion>
  <Accordion title="Lista de permissões de saída do Mattermost">
    Se o callback tiver como destino endereços privados/da tailnet/internos, defina `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost para incluir o host/domínio do callback.

    Use entradas de host/domínio, não URLs completas.

    - Correto: `gateway.tailnet-name.ts.net`
    - Incorreto: `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variáveis de ambiente (conta padrão)

Defina estas variáveis no host do Gateway se preferir usar variáveis de ambiente:

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
As variáveis de ambiente se aplicam somente à conta **padrão** (`default`). Outras contas devem usar valores de configuração.

`MATTERMOST_URL` não pode ser definida por meio de um `.env` do workspace; consulte [Arquivos .env do workspace](/pt-BR/gateway/security).
</Note>

## Modos de chat

O Mattermost responde automaticamente às DMs. O comportamento nos canais é controlado por `chatmode`:

<Tabs>
  <Tab title="oncall (padrão)">
    Responde somente quando recebe uma @menção nos canais.
  </Tab>
  <Tab title="onmessage">
    Responde a todas as mensagens do canal.
  </Tab>
  <Tab title="onchar">
    Responde quando uma mensagem começa com um prefixo de gatilho.
  </Tab>
</Tabs>

Exemplo de configuração:

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"], // padrão
    },
  },
}
```

Observações:

- `onchar` ainda responde a @menções explícitas.
- `channels.mattermost.requireMention` continua sendo respeitado, mas `chatmode` é preferível. As configurações `groups.<channelId>.requireMention` específicas de cada canal têm precedência sobre ambas.
- Depois que o bot envia uma resposta visível em uma thread de canal, as mensagens posteriores nessa mesma thread são respondidas sem uma nova @menção nem um prefixo `onchar`, permitindo que as conversas com várias interações continuem fluindo. A participação é lembrada por sete dias após a última resposta do bot nessa thread e persiste após reinicializações do Gateway. As threads que o bot apenas observou não são afetadas; inicie uma nova mensagem de nível superior para voltar a exigir uma menção explícita.

## Threads e sessões

Use `channels.mattermost.replyToMode` para controlar se as respostas de canais e grupos permanecem no canal principal ou iniciam uma thread sob a publicação que as acionou.

- `off` (padrão): responde em uma thread somente quando a publicação recebida já está em uma.
- `first`: para publicações de nível superior em canais/grupos, inicia uma thread sob essa publicação e encaminha a conversa para uma sessão com escopo de thread.
- Atualmente, `all` e `batched` têm o mesmo comportamento que `first` no Mattermost, pois, depois que o Mattermost tem uma raiz de thread, os blocos e as mídias subsequentes continuam nessa mesma thread.
- O padrão das mensagens diretas é `off`, mesmo quando `replyToMode` está definido.

Use `channels.mattermost.replyToModeByChatType` para substituir o modo em conversas `direct`, `group` ou `channel`. Defina `direct` para habilitar threads em mensagens diretas:

- `off` (padrão): as mensagens diretas permanecem sem threads em uma única sessão contínua.
- `first`, `all` ou `batched`: cada mensagem direta de nível superior inicia uma thread do Mattermost apoiada por uma sessão nova e independente.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Observações:

- As sessões com escopo de thread usam o ID da publicação que acionou a conversa como raiz da thread.
- Atualmente, `first` e `all` são equivalentes, pois, depois que o Mattermost tem uma raiz de thread, os blocos e as mídias subsequentes continuam nessa mesma thread.
- As substituições por tipo de conversa têm precedência sobre `replyToMode`. Sem uma substituição de `direct`, as implantações existentes mantêm DMs lineares, sem threads.

## Controle de acesso (DMs)

- Padrão: `channels.mattermost.dmPolicy = "pairing"` (remetentes desconhecidos recebem um código de pareamento). Outros valores: `allowlist`, `open`, `disabled`.
- Aprove por meio de:
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DMs públicas: `channels.mattermost.dmPolicy="open"` mais `channels.mattermost.allowFrom=["*"]` (o esquema de configuração exige o curinga).
- `channels.mattermost.allowFrom` aceita IDs de usuário (recomendado) e entradas `accessGroup:<name>`. Consulte [Grupos de acesso](/pt-BR/channels/access-groups).

## Canais (grupos)

- Padrão: `channels.mattermost.groupPolicy = "allowlist"` (exige menção).
- Inclua remetentes na lista de permissões com `channels.mattermost.groupAllowFrom` (IDs de usuário recomendados).
- `channels.mattermost.groupAllowFrom` aceita entradas `accessGroup:<name>`. Consulte [Grupos de acesso](/pt-BR/channels/access-groups).
- As substituições de menção específicas de cada canal ficam em `channels.mattermost.groups.<channelId>.requireMention` ou, para um padrão, em `channels.mattermost.groups["*"].requireMention`.
- A correspondência de `@username` é mutável e somente é habilitada quando `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canais abertos: `channels.mattermost.groupPolicy="open"` (exige menção).
- Ordem de resolução: `channels.mattermost.groupPolicy`, depois `channels.defaults.groupPolicy` e, por fim, `"allowlist"`.
- Observação de tempo de execução: se a seção `channels.mattermost` estiver completamente ausente, o tempo de execução falha de modo seguro usando `groupPolicy="allowlist"` nas verificações de grupo (mesmo que `channels.defaults.groupPolicy` esteja definido) e registra um aviso uma única vez.

Exemplo:

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Destinos para entrega de saída

Use estes formatos de destino com `openclaw message send` ou Cron/Webhooks:

| Destino                             | Entrega em                                                                |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `channel:<id>`                      | Canal pelo ID                                                             |
| `channel:<name>` ou `#channel-name` | Canal pelo nome, pesquisado nas equipes às quais o bot pertence           |
| `user:<id>` ou `mattermost:<id>`    | DM com esse usuário                                                       |
| `@username`                         | DM (nome de usuário resolvido por meio da API do Mattermost)              |

Os envios de saída aceitam no máximo um anexo por mensagem; divida vários arquivos em envios separados.

<Warning>
IDs opacos sem prefixo (como `64ifufp...`) são **ambíguos** no Mattermost (ID de usuário ou ID de canal).

O OpenClaw tenta resolvê-los **primeiro como usuário**:

- Se o ID existir como usuário (`GET /api/v4/users/<id>` for bem-sucedido), o OpenClaw envia uma **DM**, resolvendo o canal direto por meio de `/api/v4/channels/direct`.
- Caso contrário, o ID é tratado como um **ID de canal**.

Se precisar de um comportamento determinístico, sempre use os prefixos explícitos (`user:<id>` / `channel:<id>`).
</Warning>

## Nova tentativa de canal de DM

Quando o OpenClaw envia para um destino de DM do Mattermost e precisa primeiro resolver o canal direto, por padrão ele tenta novamente após falhas transitórias na criação do canal direto.

Use `channels.mattermost.dmChannelRetry` para ajustar esse comportamento globalmente para o Plugin do Mattermost ou `channels.mattermost.accounts.<id>.dmChannelRetry` para uma conta. Padrões:

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Observações:

- Isso se aplica somente à criação de canais de MD (`/api/v4/channels/direct`), não a todas as chamadas à API do Mattermost.
- As novas tentativas usam recuo exponencial com variação aleatória e se aplicam a falhas transitórias, como limites de taxa, respostas 5xx e erros de rede ou de tempo limite.
- Erros 4xx do cliente diferentes de `429` são tratados como permanentes e não geram novas tentativas.

## Transmissão da prévia

O Mattermost transmite o raciocínio, a atividade das ferramentas e o texto parcial da resposta para uma **publicação de prévia em rascunho**, que é finalizada no próprio lugar quando for seguro enviar a resposta final. No modo `partial`, a prévia é atualizada na mesma ID de publicação, em vez de inundar o canal com mensagens para cada fragmento. No modo `block`, a prévia alterna entre blocos de texto concluído e de atividade das ferramentas, de modo que os blocos anteriores permaneçam visíveis como publicações próprias, em vez de serem sobrescritos pelo bloco seguinte. Resultados finais com mídia ou erro cancelam as edições pendentes da prévia e usam a entrega normal, em vez de publicar uma prévia descartável.

A transmissão da prévia fica **ativada por padrão** no modo `partial`. Configure por meio de `channels.mattermost.streaming` (uma string de modo, um booleano ou um objeto como `{ mode: "progress" }`):

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Modos de transmissão">
    - `partial` (padrão): uma publicação de prévia que é editada à medida que a resposta cresce e, em seguida, finalizada com a resposta completa.
    - `block` alterna a prévia entre blocos de texto concluído e de atividade das ferramentas, de modo que cada bloco permaneça visível como uma publicação própria, em vez de ser sobrescrito no mesmo lugar. Atualizações paralelas e consecutivas de ferramentas compartilham a publicação atual de atividade das ferramentas.
    - `progress` exibe uma prévia de status durante a geração e publica a resposta final somente após a conclusão.
    - `off` desativa a transmissão da prévia. Com `blockStreaming: true`, os blocos concluídos do assistente ainda são entregues como respostas normais em blocos (publicações separadas), em vez de uma única publicação final consolidada.

  </Accordion>
  <Accordion title="Observações sobre o comportamento da transmissão">
    - Se não for possível finalizar a transmissão no próprio lugar (por exemplo, se a publicação for excluída durante a transmissão), o OpenClaw recorre ao envio de uma nova publicação final para que a resposta nunca seja perdida.
    - Cargas contendo somente raciocínio são suprimidas das publicações do canal, incluindo texto que chega como uma citação em bloco `> Thinking`. Defina `/reasoning on` para ver o raciocínio em outras superfícies; a publicação final do Mattermost mantém somente a resposta.
    - Consulte [Transmissão](/pt-BR/concepts/streaming#preview-streaming-modes) para ver a matriz de mapeamento de canais.

  </Accordion>
</AccordionGroup>

## Reações (ferramenta de mensagens)

- Use `message action=react` com `channel=mattermost`.
- `messageId` é a ID da publicação do Mattermost.
- `emoji` aceita nomes como `thumbsup` ou `:+1:` (os dois-pontos são opcionais).
- Defina `remove=true` (booleano) para remover uma reação.
- Eventos de adição e remoção de reações são encaminhados como eventos do sistema para a sessão roteada do agente, sujeitos às mesmas verificações de política de MD/grupo aplicadas às mensagens.

Exemplos:

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuração:

- `channels.mattermost.actions.reactions`: ativa/desativa ações de reação (padrão: verdadeiro).
- Substituição por conta: `channels.mattermost.accounts.<id>.actions.reactions`.

## Botões interativos (ferramenta de mensagens)

Envie mensagens com botões clicáveis. Quando um usuário clica em um botão, o agente recebe a seleção e pode responder.

Os botões vêm da carga semântica `presentation` (nas respostas normais do agente e em `message action=send`). O OpenClaw renderiza botões de valor como botões interativos do Mattermost, mantém os botões de URL visíveis no texto da mensagem e converte menus de seleção em texto legível.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"yes"},{"label":"No","value":"no"}]}]}
```

Campos dos botões da apresentação:

<ParamField path="label" type="string" required>
  Rótulo exibido (alias: `text`).
</ParamField>
<ParamField path="value" type="string">
  Valor retornado ao clicar, usado como ID da ação (aliases: `callback_data`, `callbackData`). Obrigatório para um botão clicável, a menos que `url` esteja definido.
</ParamField>
<ParamField path="url" type="string">
  Botão de link; renderizado como texto `label: url` no corpo da mensagem, em vez de um botão interativo.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Estilo do botão. O Mattermost aplica o estilo padrão aos valores que não oferece suporte.
</ParamField>

Para anunciar o suporte a botões no prompt de sistema do agente, adicione `inlineButtons` aos recursos do canal:

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Quando um usuário clica em um botão:

<Steps>
  <Step title="Verificação de acesso">
    Quem clicar deverá passar pelas mesmas verificações de política de MD/grupo aplicadas ao remetente de uma mensagem; cliques não autorizados recebem um aviso efêmero e são ignorados.
  </Step>
  <Step title="Botões substituídos por confirmação">
    Todos os botões são substituídos por uma linha de confirmação (por exemplo, "✓ **Yes** selecionado por @user").
  </Step>
  <Step title="O agente recebe a seleção">
    O agente recebe a seleção como uma mensagem de entrada (além de um evento do sistema) e responde.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Observações de implementação">
    - Os retornos de chamada dos botões usam verificação HMAC-SHA256 (automática, sem necessidade de configuração).
    - Todo o bloco de anexo é substituído ao clicar; portanto, todos os botões são removidos juntos — não é possível removê-los parcialmente.
    - IDs de ação que contêm hífens ou sublinhados são higienizadas automaticamente (limitação de roteamento do Mattermost).
    - Cliques cujo `action_id` não corresponde a uma ação na publicação original são rejeitados com `403` ("Unknown action").

  </Accordion>
  <Accordion title="Configuração e acessibilidade">
    - `channels.mattermost.capabilities`: matriz de strings de recursos. Adicione `"inlineButtons"` para ativar a descrição da ferramenta de botões no prompt de sistema do agente.
    - `channels.mattermost.interactions.callbackBaseUrl`: URL base externa opcional para retornos de chamada de botões (por exemplo, `https://gateway.example.com`). Use-a quando o Mattermost não puder acessar diretamente o Gateway pelo host ao qual ele está vinculado.
    - Em configurações com várias contas, você também pode definir o mesmo campo em `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Se `interactions.callbackBaseUrl` for omitido, o OpenClaw derivará a URL de retorno de chamada de `gateway.customBindHost` + `gateway.port` (padrão: 18789) e, em seguida, recorrerá a `http://localhost:<port>`. O caminho do retorno de chamada é `/mattermost/interactions/<accountId>`.
    - Regra de acessibilidade: a URL de retorno de chamada do botão deve estar acessível a partir do servidor Mattermost. `localhost` funciona somente quando o Mattermost e o OpenClaw são executados no mesmo host/espaço de nomes de rede.
    - `channels.mattermost.interactions.allowedSourceIps`: lista de IPs de origem permitidos para retornos de chamada de botões. Sem ela, somente origens de loopback (`127.0.0.1`, `::1`) são aceitas; portanto, um servidor Mattermost remoto deve ser incluído nessa lista, ou seus cliques serão rejeitados com `403`. Atrás de um proxy reverso, defina também `gateway.trustedProxies` para que o IP real do cliente seja obtido dos cabeçalhos encaminhados.
    - Se o destino do retorno de chamada for privado, da tailnet ou interno, adicione o host/domínio dele a `ServiceSettings.AllowedUntrustedInternalConnections` do Mattermost.

  </Accordion>
</AccordionGroup>

### Integração direta com a API (scripts externos)

Scripts externos e webhooks podem publicar botões diretamente pela API REST do Mattermost, em vez de passar pela ferramenta `message` do agente. Use `buildButtonAttachments()` do Plugin quando possível; se publicar JSON bruto, siga estas regras:

**Estrutura da carga:**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Regras críticas**

1. Os anexos devem ficar em `props.attachments`, não em `attachments` no nível superior (que é ignorado silenciosamente).
2. Toda ação precisa de `type: "button"` — sem isso, os cliques são descartados silenciosamente.
3. Toda ação precisa de um campo `id` — o Mattermost ignora ações sem IDs.
4. A `id` da ação deve ser **somente alfanumérica** (`[a-zA-Z0-9]`). Hífens e sublinhados interrompem o roteamento de ações no servidor do Mattermost (retorna 404). Remova-os antes do uso.
5. `context.action_id` deve corresponder à `id` do botão; o Gateway rejeita cliques cujo `action_id` não exista na publicação.
6. `context.action_id` é obrigatório — o manipulador de interações retorna 400 sem ele.
7. O IP de origem do retorno de chamada deve ser permitido (consulte `interactions.allowedSourceIps` acima).

</Warning>

**Geração do token HMAC**

O Gateway verifica os cliques em botões com HMAC-SHA256. Scripts externos devem gerar tokens que correspondam à lógica de verificação do Gateway:

<Steps>
  <Step title="Derive o segredo do token do bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, codificado em hexadecimal.
  </Step>
  <Step title="Crie o objeto de contexto">
    Crie o objeto de contexto com todos os campos, **exceto** `_token`.
  </Step>
  <Step title="Serialização com chaves ordenadas">
    Faça a serialização com **chaves ordenadas recursivamente** e **sem espaços** (o Gateway também canoniza objetos aninhados e produz JSON compacto).
  </Step>
  <Step title="Assine a carga">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Adicione o token">
    Adicione o resumo hexadecimal resultante como `_token` no contexto.
  </Step>
</Steps>

Exemplo em Python:

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Armadilhas comuns de HMAC">
    - O `json.dumps` do Python adiciona espaços por padrão (`{"key": "val"}`). Use `separators=(",", ":")` para corresponder à saída compacta do JavaScript (`{"key":"val"}`).
    - Sempre assine **todos** os campos do contexto (menos `_token`). O Gateway remove `_token` e depois assina tudo o que restar. Assinar apenas um subconjunto causa uma falha silenciosa de verificação.
    - Use `sort_keys=True` — o Gateway ordena as chaves antes da assinatura, e o Mattermost pode reordenar os campos de contexto ao armazenar a carga.
    - Derive o segredo do token do bot (de forma determinística), não de bytes aleatórios. O segredo deve ser o mesmo no processo que cria os botões e no Gateway que faz a verificação.

  </Accordion>
</AccordionGroup>

## Adaptador de diretório

O Plugin do Mattermost inclui um adaptador de diretório que resolve nomes de canais e usuários por meio da API do Mattermost. Isso permite usar destinos `#channel-name` e `@username` em `openclaw message send` e em entregas de Cron/Webhook.

Nenhuma configuração é necessária — o adaptador usa o token do bot definido na configuração da conta.

## Várias contas

O Mattermost oferece suporte a várias contas em `channels.mattermost.accounts`:

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Os valores da conta substituem os campos de nível superior; `channels.mattermost.defaultAccount` seleciona qual conta será usada quando nenhuma for especificada.

## Solução de problemas

<AccordionGroup>
  <Accordion title="Sem respostas nos canais">
    Verifique se o bot está no canal e mencione-o (oncall), use um prefixo de acionamento (onchar) ou defina `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Erros de autenticação ou de várias contas">
    - Verifique o token do bot, a URL base e se a conta está habilitada.
    - Problemas com várias contas: as variáveis de ambiente se aplicam somente à conta `default`.
    - Hosts Mattermost privados/da LAN precisam de `network.dangerouslyAllowPrivateNetwork: true` (a proteção contra SSRF bloqueia IPs privados por padrão).

  </Accordion>
  <Accordion title="Falha nos comandos de barra nativos">
    - `Unauthorized: invalid command token.`: o OpenClaw não aceitou o token de retorno de chamada. Causas comuns:
      - o registro do comando de barra falhou ou foi concluído apenas parcialmente na inicialização
      - o retorno de chamada está chegando ao gateway/à conta incorretos
      - o Mattermost ainda tem comandos antigos apontando para um destino de retorno de chamada anterior
      - o Gateway foi reiniciado sem reativar os comandos de barra
    - Se os comandos de barra nativos pararem de funcionar, verifique os logs em busca de `mattermost: failed to register slash commands` ou `mattermost: native slash commands enabled but no commands could be registered`.
    - Se `callbackUrl` for omitido e os logs avisarem que o retorno de chamada foi resolvido para uma URL de local loopback como `http://localhost:18789/...`, essa URL provavelmente só será acessível quando o Mattermost estiver em execução no mesmo host/espaço de nomes de rede que o OpenClaw. Em vez disso, defina explicitamente um `commands.callbackUrl` acessível externamente.

  </Accordion>
  <Accordion title="Problemas com botões">
    - Os botões aparecem como caixas brancas ou não aparecem: os dados do botão estão malformados. Cada botão de apresentação precisa de um `label` e um `value` (botões sem um deles são descartados).
    - Os botões são renderizados, mas os cliques não fazem nada: verifique se o Gateway está acessível pelo servidor Mattermost, se o IP do servidor Mattermost está incluído em `channels.mattermost.interactions.allowedSourceIps` (sem isso, somente local loopback é aceito) e se `ServiceSettings.AllowedUntrustedInternalConnections` inclui o host de retorno de chamada para destinos privados.
    - Os botões retornam 404 ao serem clicados: o `id` do botão provavelmente contém hifens ou sublinhados. O roteador de ações do Mattermost falha com IDs não alfanuméricos. Use somente `[a-zA-Z0-9]`.
    - O Gateway registra `rejected callback source`: o clique veio de um IP fora de `interactions.allowedSourceIps`. Adicione o servidor Mattermost ou seu ponto de entrada à lista de permissões e defina `gateway.trustedProxies` quando estiver atrás de um proxy reverso.
    - O Gateway registra `invalid _token`: incompatibilidade de HMAC. Verifique se todos os campos de contexto são assinados (não apenas um subconjunto), use chaves ordenadas e JSON compacto (sem espaços). Consulte a seção sobre HMAC acima.
    - O Gateway registra `missing _token in context`: o campo `_token` não está no contexto do botão. Certifique-se de incluí-lo ao criar a carga útil da integração.
    - O Gateway rejeita o clique com `Unknown action`: `context.action_id` não corresponde a nenhum `id` de ação na publicação. Defina ambos com o mesmo valor sanitizado.
    - O agente não oferece botões: adicione `capabilities: ["inlineButtons"]` à configuração do canal Mattermost.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) - comportamento de conversas em grupo e controle por menção
- [Pareamento](/pt-BR/channels/pairing) - autenticação por mensagem direta e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
